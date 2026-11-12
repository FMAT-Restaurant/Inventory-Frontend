/**
 * Tipos del registro de mermas: pérdidas de insumos ya descontados al
 * servir una orden. Registrar una merma no modifica el stock.
 */

export interface ServedOrder {
  orderId: string;
  servedAt?: string;
}

/** Lote consumido por una orden y cuánto queda disponible para merma. */
export interface ConsumedBatch {
  batchId: string;
  consumed: number;
  alreadyWasted: number;
  remaining: number;
}

export interface WasteInput {
  orderId: string;
  batchId: string;
  quantity: number;
  reason: string;
}

export interface WasteRepository {
  listServedOrders(): Promise<ServedOrder[]>;
  listConsumedBatches(orderId: string): Promise<ConsumedBatch[]>;
  register(input: WasteInput): Promise<void>;
}
