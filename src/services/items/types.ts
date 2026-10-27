/**
 * Tipos del dominio de items expuestos a la UI.
 */

export type EstadoUmbral = "OPTIMO" | "BAJO" | "CRITICO";

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
}

export interface Item {
  id: string;
  sku: string;
  name: string;
  description?: string;
  unit: string;
  minStock: number;
  averageCost: number;
  category: string;
  isPerishable: boolean;
  storageCondition: string;
  supplierIdSugested: string | null;
  supplierSugested?: Supplier | null;
  totalStock: number;
  reservedStock: number;
  availableStock: number;
  status: EstadoUmbral;
}

export interface ItemInput {
  id?: string;
  sku: string;
  name: string;
  description?: string;
  unit: string;
  minStock: number;
  averageCost?: number;
  category: string;
  isPerishable: boolean;
  storageCondition: string;
  supplierIdSugested: string | null;
}

/**
 * Contrato único de acceso a datos de items.
 * Implementado por el repositorio mock (dev) y el HTTP (qa/prod).
 */
export interface ItemsRepository {
  list(): Promise<Item[]>;
  getById(id: string): Promise<Item | null>;
  create(input: ItemInput): Promise<Item>;
  update(id: string, input: ItemInput): Promise<Item>;
  remove(id: string): Promise<void>;
  listSuppliers(): Promise<Supplier[]>;
  subscribe?(listener: () => void): () => void;
}
