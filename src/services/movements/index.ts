/**
 * Selector de la capa de datos de movimientos de inventario.
 *
 * - dev        -> derivados del historial del mockService
 * - qa / prod  -> backend real vía HTTP (/movements)
 */

import { ENV } from "../../config/env";
import { mockMovementsRepository } from "./mockMovementsRepository";
import { httpMovementsRepository } from "./httpMovementsRepository";
import type { MovementsRepository } from "./types";

export function getMovementsRepository(): MovementsRepository {
  return ENV.USE_MOCK ? mockMovementsRepository : httpMovementsRepository;
}

export const movementsRepository: MovementsRepository = getMovementsRepository();

export type {
  MovementFilters,
  MovementType,
  MovementsRepository,
  StockMovement,
} from "./types";
