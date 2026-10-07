/**
 * Tipos del dominio de ingredientes expuestos a la UI.
 */

export type EstadoUmbral = "OPTIMO" | "BAJO" | "CRITICO";

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  min: number;
  averageCost: number;
  category: string;
  supplierIdSugested: string | null;
  supplierSugested?: Supplier | null;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  status: EstadoUmbral;
}

export interface IngredientInput {
  id?: string;
  name: string;
  unit: string;
  minStock: number;
  averageCost: number;
  category: string;
  supplierIdSugested: string | null;
}

/**
 * Contrato único de acceso a datos de ingredientes.
 * Implementado por el repositorio mock (dev) y el HTTP (qa/prod).
 */
export interface IngredientsRepository {
  list(): Promise<Ingredient[]>;
  getById(id: string): Promise<Ingredient | null>;
  create(input: IngredientInput): Promise<Ingredient>;
  update(id: string, input: IngredientInput): Promise<Ingredient>;
  remove(id: string): Promise<void>;
  listSuppliers(): Promise<Supplier[]>;
  subscribe?(listener: () => void): () => void;
}
