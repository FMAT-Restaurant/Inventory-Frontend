/**
 * Tipos del registro de mermas. Una merma manual solo necesita el lote en el
 * que se generó, la cantidad perdida y el motivo; descuenta del lote. Las
 * mermas de órdenes las registra el backend al recibirlas de Órdenes.
 */

export interface WasteInput {
  batchId: string;
  quantity: number;
  reason: string;
}

export interface WasteRepository {
  register(input: WasteInput): Promise<void>;
}
