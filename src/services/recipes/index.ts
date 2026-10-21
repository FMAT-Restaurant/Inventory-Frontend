/**
 * Selector de la capa de datos de recetas.
 *
 * - dev        -> datos locales mockeados
 * - qa / prod  -> backend real vía HTTP (/recipes)
 */

import { ENV } from "../../config/env";
import { mockRecipesRepository } from "./mockRecipesRepository";
import { httpRecipesRepository } from "./httpRecipesRepository";
import type { RecipesRepository } from "./types";

export function getRecipesRepository(): RecipesRepository {
  return ENV.USE_MOCK ? mockRecipesRepository : httpRecipesRepository;
}

export const recipesRepository: RecipesRepository = getRecipesRepository();

export type {
  Recipe,
  RecipeItem,
  CreateRecipeInput,
  CreateRecipeItemInput,
  UpdateRecipeInput,
  QueryRecipesParams,
  RecipeSaveResult,
  RecipesRepository,
} from "./types";
