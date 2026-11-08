/**
 * Tipos del dominio de movimientos de inventario (kardex) expuestos a la UI.
 */

export type MovementType = "in" | "out" | "waste" | "adjustment";

export interface StockMovement {
  id: string;
  batchId: string;
  movementType: MovementType;
  quantity: number;
  referenceId: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface MovementFilters {
  batchId?: string;
  movementType?: MovementType;
  referenceId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

/**
 * Contrato único de acceso a datos de movimientos.
 * Los movimientos son de solo lectura: no se editan ni eliminan.
 */
export interface MovementsRepository {
  list(filters?: MovementFilters): Promise<StockMovement[]>;
  subscribe?(listener: () => void): () => void;
}
