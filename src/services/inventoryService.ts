import {
  Item,
  Batch,
  Movement,
  Supplier,
  HistoricalCost,
  Recipe
} from '../types/index';
import {
  ItemInput,
  BatchInput,
  AdjustInput,
  WasteInput,
  SupplierInput
} from '../types/inputs';

export interface InventoryService {
  // --- Insumos ---
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item>;
  saveItem(data: ItemInput): Promise<Item>;

  // --- Lotes ---
  getBatches(itemId: string): Promise<Batch[]>;
  addBatch(data: BatchInput): Promise<Batch>;

  // --- Ajustes y mermas ---
  adjustStock(data: AdjustInput): Promise<void>;
  registerWaste(data: WasteInput): Promise<void>;

  // --- Movimientos ---
  getMovements(itemId: string): Promise<Movement[]>;

  // --- Proveedores ---
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier>;
  saveSupplier(data: SupplierInput): Promise<Supplier>;
  getCostHistory(supplierId: string): Promise<HistoricalCost[]>;

  // --- Recetas ---
  getRecipes(): Promise<Recipe[]>;
  getRecipe(id: string): Promise<Recipe>;
}
