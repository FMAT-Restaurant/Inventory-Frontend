/**
 * Implementación HTTP del repositorio de lotes para qa/prod.
 *
 * Contrato REST consumido (base = VITE_API_URL):
 *   GET    /batches                   -> Batch[]
 *   GET    /batches?itemId=:id  -> Batch[]
 *   GET    /batches/:id               -> Batch
 *   POST   /batches                   (CreateBatchInput) -> Batch
 *   PATCH  /batches/:id               (UpdateBatchInput) -> Batch
 *   DELETE /batches/:id               -> 200 / 204
 */

import { request } from "../http/client";
import type {
  Batch,
  BatchesRepository,
  BatchStatus,
  CreateBatchInput,
  UpdateBatchInput,
} from "./types";

interface RawBatch {
  id?: string;
  _id?: string;
  batchNumber?: string;
  itemId: string;
  supplierId?: string | null;
  initialQuantity?: number;
  quantity: number;
  cost: number;
  expirationDate: string;
  createdAt?: string;
  entryDate?: string;
  status?: BatchStatus;
}

function formatDateOnly(dateValue?: string): string {
  if (!dateValue) return "";
  return String(dateValue).slice(0, 10);
}

function normalizeBatch(raw: RawBatch): Batch {
  const id = String(raw.id ?? raw._id ?? "");
  const quantity = Number(raw.quantity ?? 0);
  const initialQuantity = Number(raw.initialQuantity ?? quantity);

  return {
    id,
    batchNumber: raw.batchNumber || id,
    itemId: String(raw.itemId),
    supplierId: raw.supplierId ? String(raw.supplierId) : null,
    initialQuantity,
    quantity,
    cost: Number(raw.cost ?? 0),
    expirationDate: formatDateOnly(raw.expirationDate),
    entryDate: formatDateOnly(raw.entryDate ?? raw.createdAt),
    status: raw.status ?? "active",
  };
}

export const httpBatchesRepository: BatchesRepository = {
  async list(itemId?: string) {
    const query = itemId
      ? `?itemId=${encodeURIComponent(itemId)}`
      : "";
    const items = await request<RawBatch[]>(`/batches${query}`);
    return (items ?? []).map(normalizeBatch);
  },

  async getById(id: string) {
    try {
      const item = await request<RawBatch>(`/batches/${id}`);
      return item ? normalizeBatch(item) : null;
    } catch {
      return null;
    }
  },

  async create(input: CreateBatchInput) {
    const payload: Record<string, unknown> = {
      itemId: input.itemId,
      quantity: Number(input.quantity),
      cost: Number(input.cost),
      expirationDate: input.expirationDate,
    };

    if (input.batchNumber && input.batchNumber.trim()) {
      payload.batchNumber = input.batchNumber.trim();
    }
    if (input.supplierId) {
      payload.supplierId = input.supplierId;
    }

    const created = await request<RawBatch>("/batches", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return normalizeBatch(created);
  },

  async update(id: string, input: UpdateBatchInput) {
    const payload: Record<string, unknown> = {};
    if (input.quantity !== undefined) payload.quantity = Number(input.quantity);
    if (input.cost !== undefined) payload.cost = Number(input.cost);
    if (input.expirationDate !== undefined) {
      payload.expirationDate = input.expirationDate;
    }

    const updated = await request<RawBatch>(`/batches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return normalizeBatch(updated);
  },

  async remove(id: string) {
    await request<void>(`/batches/${id}`, { method: "DELETE" });
  },
};
