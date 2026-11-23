/**
 * Tipos del dominio de lotes (batches) expuestos a la UI.
 */

import type { PaginatedResponse } from "../types";

export type BatchStatus = "active" | "expires_today" | "expired" | "depleted";

export interface Batch {
  id: string;
  batchNumber: string;
  itemId: string;
  supplierId: string | null;
  initialQuantity: number;
  quantity: number;
  cost: number;
  expirationDate: string;
  entryDate: string;
  status: BatchStatus;
}

export interface CreateBatchInput {
  batchNumber?: string;
  itemId: string;
  supplierId?: string | null;
  quantity: number;
  cost: number;
  expirationDate: string;
}

export interface UpdateBatchInput {
  quantity?: number;
  cost?: number;
  expirationDate?: string;
}

/** Parámetros de listado de lotes. */
export interface ListBatchesParams {
  itemId?: string;
  page?: number;
  limit?: number;
}

/**
 * Contrato único de acceso a datos de lotes.
 * Implementado por el repositorio mock (dev) y el HTTP (qa/prod).
 */
export interface BatchesRepository {
  list(params?: ListBatchesParams): Promise<PaginatedResponse<Batch>>;
  getById(id: string): Promise<Batch | null>;
  create(input: CreateBatchInput): Promise<Batch>;
  update(id: string, input: UpdateBatchInput): Promise<Batch>;
  remove(id: string): Promise<void>;
  subscribe?(listener: () => void): () => void;
}
