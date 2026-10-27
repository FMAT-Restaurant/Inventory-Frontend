/**
 * Tipos del dominio de recetas expuestos a la UI y contratos de repositorio.
 */

export interface RecipeItem {
  itemId: string;
  itemName: string;
  unit: string;
  requiredQuantity: number;
  availableStock: number;
  hasSufficientStock: boolean;
}

export interface Recipe {
  id: string;
  plateId: string;
  name: string;
  isAvailable: boolean;
  maxPreparablePortions: number;
  productionCost: number;
  items: RecipeItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRecipeItemInput {
  itemId: string;
  requiredQuantity: number;
}

export interface CreateRecipeInput {
  plateId: string;
  name: string;
  items: CreateRecipeItemInput[];
}

export type UpdateRecipeInput = Partial<CreateRecipeInput>;

export interface QueryRecipesParams {
  available?: boolean;
}

export interface RecipeSaveResult {
  recipe: Recipe;
  isNew: boolean; // true = 201 Created (nueva receta), false = 200 OK (upsert por plateId)
}

/**
 * Contrato único de acceso a datos de recetas.
 * Implementado por el repositorio mock (dev) y el HTTP (qa/prod).
 */
export interface RecipesRepository {
  list(params?: QueryRecipesParams): Promise<Recipe[]>;
  getByIdOrPlateId(idOrPlateId: string): Promise<Recipe | null>;
  save(input: CreateRecipeInput): Promise<RecipeSaveResult>;
  update(id: string, input: UpdateRecipeInput): Promise<Recipe>;
  remove(id: string): Promise<void>;
  subscribe?(listener: () => void): () => void;
}
