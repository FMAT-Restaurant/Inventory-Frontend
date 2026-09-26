export type ServiceErrorCode =
  | 'STOCK_NEGATIVO'
  | 'UMBRAL_INVALIDO'
  | 'RECETA_NO_ENCONTRADA'
  | 'INGREDIENTE_NO_ENCONTRADO'
  | 'PROVEEDOR_NO_ENCONTRADO'
  | 'LOTE_NO_ENCONTRADO'
  | 'LOTE_VENCIDO'
  | 'CANTIDAD_INVALIDA'
  | 'COSTO_INVALIDO'
  | 'CADUCIDAD_INVALIDA'
  | 'ORDEN_NO_SERVIDA'
  | 'RESERVA_NO_ENCONTRADA'
  | 'MERMA_EXCEDE_CONSUMIDO';

export class ServiceError extends Error {
  constructor(
    public code: ServiceErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}
