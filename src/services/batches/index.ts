/**
 * Selector de la capa de datos de lotes (batches).
 *
 * - dev        -> datos locales mockeados (mockService existente)
 * - qa / prod  -> backend real vía HTTP (/batches)
 */

import { ENV } from "../../config/env";
import { mockBatchesRepository } from "./mockBatchesRepository";
import { httpBatchesRepository } from "./httpBatchesRepository";
import type { BatchesRepository } from "./types";

export function getBatchesRepository(): BatchesRepository {
  return ENV.USE_MOCK ? mockBatchesRepository : httpBatchesRepository;
}

export const batchesRepository: BatchesRepository = getBatchesRepository();

export type {
  Batch,
  BatchStatus,
  BatchesRepository,
  CreateBatchInput,
  UpdateBatchInput,
} from "./types";
