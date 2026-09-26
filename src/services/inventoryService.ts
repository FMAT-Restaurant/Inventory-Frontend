import {
  Ingredient,
  Batch,
  Movement,
  Supplier,
  HistoricalCost,
  Recipe
} from '../types/index';
import {
  IngredientInput,
  BatchInput,
  AdjustInput,
  WasteInput,
  SupplierInput
} from '../types/inputs';

export interface InventoryService {
  // --- Ingredientes ---
  getIngredients(): Promise<Ingredient[]>;
  getIngredient(id: string): Promise<Ingredient>;
  saveIngredient(data: IngredientInput): Promise<Ingredient>;

  // --- Lotes ---
  getBatches(ingredientId: string): Promise<Batch[]>;
  addBatch(data: BatchInput): Promise<Batch>;

  // --- Ajustes y mermas ---
  adjustStock(data: AdjustInput): Promise<void>;
  registerWaste(data: WasteInput): Promise<void>;

  // --- Movimientos ---
  getMovements(ingredientId: string): Promise<Movement[]>;

  // --- Proveedores ---
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier>;
  saveSupplier(data: SupplierInput): Promise<Supplier>;
  getCostHistory(supplierId: string): Promise<HistoricalCost[]>;

  // --- Recetas ---
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe>;
}
