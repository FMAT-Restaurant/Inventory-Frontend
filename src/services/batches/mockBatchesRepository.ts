/**
 * Repositorio de lotes para el ambiente de desarrollo (dev).
 *
 * Reutiliza el `mockService` / `inventoryStore` en memoria para mantener
 * una única fuente de verdad con las demás vistas en modo mock.
 */

import { mockService } from "../inventory/mockService.js";
import { inventoryStore } from "../inventory/store.js";
import { EstadoLote } from "../inventory/types.js";
import type {
  Batch,
  BatchesRepository,
  BatchStatus,
  CreateBatchInput,
  UpdateBatchInput,
} from "./types";

interface MockRawLote {
  id: string;
  batchNumber?: string;
  itemId: string;
  providerId?: string | null;
  supplierId?: string | null;
  cantidadInicial: number;
  cantidadActual: number;
  costoUnitario: number;
  fechaCaducidad: string;
  fechaIngreso: string;
  estado: string;
}

function computeStatusFromMock(lote: MockRawLote): BatchStatus {
  if (lote.cantidadActual <= 0 || lote.estado === EstadoLote.AGOTADO) {
    return "depleted";
  }
  if (lote.estado === EstadoLote.CADUCADO) {
    return "expired";
  }

  const today = new Date().toISOString().slice(0, 10);
  const exp = String(lote.fechaCaducidad || "").slice(0, 10);
  if (exp && exp < today) return "expired";
  if (exp && exp === today) return "expires_today";
  return "active";
}

function toBatch(lote: MockRawLote): Batch {
  return {
    id: lote.id,
    batchNumber: lote.batchNumber || lote.id,
    itemId: lote.itemId,
    supplierId: lote.supplierId ?? lote.providerId ?? null,
    initialQuantity: Number(lote.cantidadInicial ?? lote.cantidadActual ?? 0),
    quantity: Number(lote.cantidadActual ?? 0),
    cost: Number(lote.costoUnitario ?? 0),
    expirationDate: String(lote.fechaCaducidad || "").slice(0, 10),
    entryDate: String(lote.fechaIngreso || "").slice(0, 10),
    status: computeStatusFromMock(lote),
  };
}

export const mockBatchesRepository: BatchesRepository = {
  async list(itemId?: string): Promise<Batch[]> {
    const snapshot = mockService.getSnapshot();
    const lotes = (snapshot.lotes ?? []) as MockRawLote[];
    const filtered = itemId
      ? lotes.filter((l) => l.itemId === itemId)
      : lotes;
    return filtered.map(toBatch);
  },

  async getById(id: string): Promise<Batch | null> {
    const snapshot = mockService.getSnapshot();
    const lote = (snapshot.lotes as MockRawLote[]).find((l) => l.id === id);
    return lote ? toBatch(lote) : null;
  },

  async create(input: CreateBatchInput): Promise<Batch> {
    const providerId =
      input.supplierId || inventoryStore.proveedores[0]?.id || "prov-1";

    const res = await mockService.registrarCompraProveedor({
      providerId,
      itemsComprados: [
        {
          itemId: input.itemId,
          cantidad: Number(input.quantity),
          costoUnitario: Number(input.cost),
          fechaCaducidad: input.expirationDate,
        },
      ],
    });

    const createdLote = res.lotesNuevos[0] as MockRawLote;
    if (input.batchNumber && input.batchNumber.trim()) {
      createdLote.batchNumber = input.batchNumber.trim();
    }
    return toBatch(createdLote);
  },

  async update(id: string, input: UpdateBatchInput): Promise<Batch> {
    const lote = inventoryStore.lotes.find((l: MockRawLote) => l.id === id) as
      | MockRawLote
      | undefined;
    if (!lote) {
      throw new Error(`Lote no encontrado: ${id}`);
    }

    if (input.quantity !== undefined) {
      lote.cantidadActual = Number(input.quantity);
    }
    if (input.cost !== undefined) {
      lote.costoUnitario = Number(input.cost);
    }
    if (input.expirationDate !== undefined) {
      lote.fechaCaducidad = input.expirationDate;
    }

    const nextStatus = computeStatusFromMock(lote);
    lote.estado =
      nextStatus === "depleted"
        ? EstadoLote.AGOTADO
        : nextStatus === "expired"
          ? EstadoLote.CADUCADO
          : EstadoLote.ACTIVO;

    inventoryStore.notify();
    return toBatch(lote);
  },

  async remove(id: string): Promise<void> {
    const index = inventoryStore.lotes.findIndex(
      (l: MockRawLote) => l.id === id,
    );
    if (index === -1) {
      throw new Error(`Lote no encontrado: ${id}`);
    }
    inventoryStore.lotes.splice(index, 1);
    inventoryStore.notify();
  },

  subscribe(listener: () => void) {
    const unsubscribe = mockService.subscribe(() => listener());
    return () => {
      unsubscribe();
    };
  },
};
