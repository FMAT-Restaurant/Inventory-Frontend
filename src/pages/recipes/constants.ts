/**
 * Constantes y definiciones de tipos para la sección de recetas.
 */

export type RecipeFilter = 'ALL' | 'AVAILABLE' | 'UNAVAILABLE';

export const RECIPE_FILTERS: Record<RecipeFilter, RecipeFilter> = {
  ALL: 'ALL',
  AVAILABLE: 'AVAILABLE',
  UNAVAILABLE: 'UNAVAILABLE',
};

export const RECIPE_FILTER_LABELS: Record<RecipeFilter, string> = {
  ALL: 'Todas',
  AVAILABLE: 'Disponibles',
  UNAVAILABLE: 'Agotadas',
};

export const MIN_REQUIRED_QUANTITY = 0.0001;
