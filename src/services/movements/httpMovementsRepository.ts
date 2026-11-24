/**
 * Implementación HTTP del repositorio de movimientos para qa/prod.
 *
 * Contrato REST consumido (base = VITE_API_URL):
 *   GET /movements?batchId=&movementType=&referenceId=&from=&to=&limit=
 *
 * Los movimientos son de solo lectura.
 */

import { request } from "../http/client";
import { buildPageQuery, toPage } from "../pagination";
import type {
  MovementFilters,
  MovementType,
  MovementsRepository,
  StockMovement,
} from "./types";

interface RawMovement {
  id?: string;
  _id?: string;
  batchId?: string | { _id?: string };
  movementType?: string;
  quantity?: number;
  referenceId?: string | null;
  reason?: string | null;
  createdBy?: string;
  createdAt?: string;
}

const MOVEMENT_TYPES: MovementType[] = ["in", "out", "waste", "adjustment"];

function normalizeType(value: unknown): MovementType {
  return MOVEMENT_TYPES.includes(value as MovementType)
    ? (value as MovementType)
    : "adjustment";
}

function normalizeId(value: RawMovement["batchId"]): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id ?? "");
}

function normalizeMovement(raw: RawMovement): StockMovement {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    batchId: normalizeId(raw.batchId),
    movementType: normalizeType(raw.movementType),
    quantity: Number(raw.quantity ?? 0),
    referenceId: raw.referenceId ? String(raw.referenceId) : null,
    reason: raw.reason ? String(raw.reason) : null,
    createdBy: raw.createdBy ? String(raw.createdBy) : "system",
    createdAt: raw.createdAt ?? "",
  };
}

export const httpMovementsRepository: MovementsRepository = {
  async list(filters: MovementFilters = {}) {
    const query = buildPageQuery(filters, {
      batchId: filters.batchId,
      movementType: filters.movementType,
      referenceId: filters.referenceId,
      from: filters.from,
      to: filters.to,
    });
    const raw = await request<unknown>(`/movements${query}`);
    const page = toPage<RawMovement, StockMovement>(
      raw,
      filters,
      normalizeMovement,
    );
    // El backend ya ordena por fecha desc; se mantiene el sort como
    // salvaguarda frente a respuestas desordenadas.
    page.items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return page;
  },
};
