/**
 * Tipos del dominio de items expuestos a la UI.
 */

import type { PaginatedResponse } from "../types";

export type EstadoUmbral = "OPTIMO" | "BAJO" | "CRITICO";

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  /** `false` cuando el proveedor fue dado de baja (baja lógica). */
  isActive?: boolean;
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

export interface ListItemsParams {
  q?: string;
  page?: number;
  limit?: number;
}

/**
 * Contrato único de acceso a datos de items.
 * Implementado por el repositorio mock (dev) y el HTTP (qa/prod).
 */
export interface ItemsRepository {
  list(params?: ListItemsParams): Promise<PaginatedResponse<Item>>;
  getById(id: string): Promise<Item | null>;
  create(input: ItemInput): Promise<Item>;
  update(id: string, input: ItemInput): Promise<Item>;
  remove(id: string): Promise<void>;
  /** Incluye los proveedores dados de baja (`isActive: false`). */
  listSuppliers(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Supplier>>;
  subscribe?(listener: () => void): () => void;
}
