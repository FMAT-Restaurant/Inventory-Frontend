/**
 * Enumeraciones y constantes para el microservicio de inventario
 */

export const EstadoUmbral = Object.freeze({
  OPTIMO: 'OPTIMO',
  BAJO: 'BAJO',
  CRITICO: 'CRITICO'
});

export const EstadoLote = Object.freeze({
  ACTIVO: 'ACTIVO',
  AGOTADO: 'AGOTADO',
  CADUCADO: 'CADUCADO'
});

export const EstadoReserva = Object.freeze({
  RESERVADO: 'RESERVADO',
  CONSUMIDO: 'CONSUMIDO',
  LIBERADO: 'LIBERADO',
  MERMADO: 'MERMADO'
});

export const TipoMovimiento = Object.freeze({
  COMPRA: 'COMPRA',
  RESERVA: 'RESERVA',
  CONSUMO_FEFO: 'CONSUMO_FEFO',
  LIBERACION: 'LIBERACION',
  MERMA_CADUCIDAD: 'MERMA_CADUCIDAD',
  MERMA_COMANDA: 'MERMA_COMANDA'
});
