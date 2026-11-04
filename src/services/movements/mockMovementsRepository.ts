/**
 * Repositorio de movimientos para el ambiente de desarrollo (dev).
 *
 * Deriva los movimientos desde el `historialMovimientos` del mockService:
 *   - COMPRA           -> un movimiento "in" por cada lote generado.
 *   - CONSUMO_FEFO     -> un movimiento "out" por cada lote descontado.
 *   - MERMA_CADUCIDAD  -> un movimiento "waste".
 *   - MERMA_COMANDA    -> un movimiento "waste".
 *   - RESERVA / LIBERACION se omiten (no representan movimiento físico).
 */

import { mockService } from "../inventory/mockService.js";
import { TipoMovimiento } from "../inventory/types.js";
import type {
  MovementFilters,
  MovementType,
  MovementsRepository,
  StockMovement,
} from "./types";

interface RawLote {
  id: string;
  itemId?: string;
  cantidadInicial?: number;
  cantidadActual?: number;
}

interface RawMovimiento {
  id: string;
  tipo: string;
  fecha: string;
  detalle: Record<string, unknown>;
}

interface RawSnapshot {
  historialMovimientos: RawMovimiento[];
  lotes: RawLote[];
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function buildMovements(snapshot: RawSnapshot): StockMovement[] {
  const lotById = new Map(
    (snapshot.lotes ?? []).map((lote) => [String(lote.id), lote]),
  );
  const movements: StockMovement[] = [];

  for (const raw of snapshot.historialMovimientos ?? []) {
    const detalle = raw.detalle ?? {};
    const createdAt = raw.fecha;

    if (raw.tipo === TipoMovimiento.COMPRA) {
      const lotIds = asArray(detalle.lotesGenerados).map(String);
      const purchasedItems = asArray(detalle.items).map(asRecord);

      lotIds.forEach((batchId, index) => {
        const lote = lotById.get(batchId);
        const purchased = purchasedItems[index] ?? {};
        const quantity = asNumber(lote?.cantidadInicial ?? purchased.cantidad);
        if (!batchId || quantity <= 0) return;

        movements.push({
          id: `${raw.id}-in-${index}`,
          batchId,
          movementType: "in",
          quantity,
          referenceId: asString(detalle.providerId),
          reason: "Compra a proveedor",
          createdBy: "system",
          createdAt,
        });
      });
      continue;
    }

    if (raw.tipo === TipoMovimiento.CONSUMO_FEFO) {
      const traces = asArray(detalle.trazaConsumoGlobal).map(asRecord);

      traces.forEach((trace, traceIndex) => {
        const breakdown = asArray(trace.desgloseLotes).map(asRecord);
        breakdown.forEach((entry, entryIndex) => {
          const batchId = String(entry.loteId ?? "");
          const quantity = asNumber(entry.cantidadDescontada);
          if (!batchId || quantity <= 0) return;

          movements.push({
            id: `${raw.id}-out-${traceIndex}-${entryIndex}`,
            batchId,
            movementType: "out",
            quantity,
            referenceId: asString(detalle.orderId),
            reason:
              asString(detalle.motivo) ?? "Salida de almacén por preparación",
            createdBy: "system",
            createdAt,
          });
        });
      });
      continue;
    }

    if (
      raw.tipo === TipoMovimiento.MERMA_CADUCIDAD ||
      raw.tipo === TipoMovimiento.MERMA_COMANDA
    ) {
      const batchId = String(detalle.loteId ?? "");
      const quantity = asNumber(detalle.cantidad);
      if (!batchId || quantity <= 0) continue;

      movements.push({
        id: `${raw.id}-waste-${batchId}`,
        batchId,
        movementType: "waste",
        quantity,
        referenceId: asString(detalle.orderId),
        reason: asString(detalle.motivo) ?? "Merma de inventario",
        createdBy: "system",
        createdAt,
      });
    }
  }

  return movements.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function applyFilters(
  movements: StockMovement[],
  filters: MovementFilters,
): StockMovement[] {
  let result = movements;

  if (filters.batchId) {
    result = result.filter((m) => m.batchId === filters.batchId);
  }
  if (filters.movementType) {
    result = result.filter((m) => m.movementType === filters.movementType);
  }
  if (filters.referenceId) {
    result = result.filter((m) => m.referenceId === filters.referenceId);
  }
  if (filters.from) {
    const from = new Date(filters.from).getTime();
    result = result.filter((m) => new Date(m.createdAt).getTime() >= from);
  }
  if (filters.to) {
    const to = new Date(filters.to).getTime();
    result = result.filter((m) => new Date(m.createdAt).getTime() <= to);
  }
  if (filters.limit && filters.limit > 0) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

export const mockMovementsRepository: MovementsRepository = {
  async list(filters: MovementFilters = {}): Promise<StockMovement[]> {
    const snapshot = mockService.getSnapshot() as unknown as RawSnapshot;
    return applyFilters(buildMovements(snapshot), filters);
  },

  subscribe(listener: () => void) {
    const unsubscribe = mockService.subscribe(() => listener());
    return () => {
      unsubscribe();
    };
  },
};

export type { MovementType };
