/**
 * Selector de la capa de datos de items.
 *
 * - dev        -> datos locales mockeados (mockService existente)
 * - qa / prod  -> backend real vía HTTP
 */

import { ENV } from "../../config/env";
import { mockItemsRepository } from "./mockItemsRepository";
import { httpItemsRepository } from "./httpItemsRepository";
import type { ItemsRepository } from "./types";

export function getItemsRepository(): ItemsRepository {
  return ENV.USE_MOCK ? mockItemsRepository : httpItemsRepository;
}

export const itemsRepository: ItemsRepository = getItemsRepository();

export type {
  Item,
  ItemInput,
  ItemsRepository,
  Supplier,
  EstadoUmbral,
} from "./types";
