/**
 * Selector de la capa de datos de ingredientes.
 *
 * - dev        -> datos locales mockeados (mockService existente)
 * - qa / prod  -> backend real vía HTTP
 */

import { ENV } from "../../config/env";
import { mockIngredientsRepository } from "./mockIngredientsRepository";
import { httpIngredientsRepository } from "./httpIngredientsRepository";
import type { IngredientsRepository } from "./types";

export function getIngredientsRepository(): IngredientsRepository {
  return ENV.USE_MOCK ? mockIngredientsRepository : httpIngredientsRepository;
}

export const ingredientsRepository: IngredientsRepository =
  getIngredientsRepository();

export type {
  Ingredient,
  IngredientInput,
  IngredientsRepository,
  Supplier,
  EstadoUmbral,
} from "./types";
