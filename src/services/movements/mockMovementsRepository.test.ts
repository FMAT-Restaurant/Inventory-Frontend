import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockMovementsRepository } from './mockMovementsRepository';
import { mockService } from '../inventory/mockService.js';
import { TipoMovimiento } from '../inventory/types.js';

const COMPRA_MOVEMENT = {
  id: 'mov-compra',
  tipo: TipoMovimiento.COMPRA,
  fecha: '2026-11-01T10:00:00.000Z',
  detalle: {
    providerId: 'prov-1',
    items: [{ itemId: 'item-1', cantidad: 10 }],
    lotesGenerados: ['lot-1'],
  },
};

const CONSUMO_MOVEMENT = {
  id: 'mov-consumo',
  tipo: TipoMovimiento.CONSUMO_FEFO,
  fecha: '2026-11-02T12:00:00.000Z',
  detalle: {
    orderId: 'order-9',
    motivo: 'Servicio de comida',
    trazaConsumoGlobal: [
      {
        itemId: 'item-1',
        desgloseLotes: [
          { loteId: 'lot-1', cantidadDescontada: 2.5 },
          { loteId: 'lot-2', cantidadDescontada: 1 },
        ],
      },
    ],
  },
};

const MERMA_MOVEMENT = {
  id: 'mov-merma',
  tipo: TipoMovimiento.MERMA_CADUCIDAD,
  fecha: '2026-11-03T09:00:00.000Z',
  detalle: {
    loteId: 'lot-2',
    cantidad: 3,
    motivo: 'Lote caducado en almacén',
  },
};

const RESERVA_MOVEMENT = {
  id: 'mov-reserva',
  tipo: TipoMovimiento.RESERVA,
  fecha: '2026-11-04T09:00:00.000Z',
  detalle: { orderId: 'order-9' },
};

function snapshot(historialMovimientos: unknown[]) {
  return {
    historialMovimientos,
    lotes: [
      { id: 'lot-1', itemId: 'item-1', cantidadInicial: 10 },
      { id: 'lot-2', itemId: 'item-1', cantidadInicial: 20 },
    ],
  } as never;
}

describe('mockMovementsRepository', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('mapeo desde historialMovimientos', () => {
    it('convierte COMPRA en un movimiento "in" por lote generado', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([COMPRA_MOVEMENT]),
      );

      const result = await mockMovementsRepository.list();

      expect(result).toEqual([
        {
          id: 'mov-compra-in-0',
          batchId: 'lot-1',
          movementType: 'in',
          quantity: 10,
          referenceId: 'prov-1',
          reason: 'Compra a proveedor',
          createdBy: 'system',
          createdAt: '2026-11-01T10:00:00.000Z',
        },
      ]);
    });

    it('convierte CONSUMO_FEFO en un movimiento "out" por lote descontado', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([CONSUMO_MOVEMENT]),
      );

      const result = await mockMovementsRepository.list();

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'mov-consumo-out-0-0',
        batchId: 'lot-1',
        movementType: 'out',
        quantity: 2.5,
        referenceId: 'order-9',
        reason: 'Servicio de comida',
      });
      expect(result[1]).toMatchObject({
        batchId: 'lot-2',
        movementType: 'out',
        quantity: 1,
      });
    });

    it('convierte MERMA_CADUCIDAD en un movimiento "waste"', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([MERMA_MOVEMENT]),
      );

      const result = await mockMovementsRepository.list();

      expect(result).toEqual([
        expect.objectContaining({
          id: 'mov-merma-waste-lot-2',
          batchId: 'lot-2',
          movementType: 'waste',
          quantity: 3,
          reason: 'Lote caducado en almacén',
        }),
      ]);
    });

    it('omite RESERVA y LIBERACION', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([
          RESERVA_MOVEMENT,
          { ...RESERVA_MOVEMENT, id: 'mov-liberacion', tipo: TipoMovimiento.LIBERACION },
        ]),
      );

      const result = await mockMovementsRepository.list();

      expect(result).toEqual([]);
    });

    it('ordena los movimientos por fecha descendente', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([COMPRA_MOVEMENT, CONSUMO_MOVEMENT, MERMA_MOVEMENT]),
      );

      const result = await mockMovementsRepository.list();

      expect(result.map((m) => m.id)).toEqual([
        'mov-merma-waste-lot-2',
        'mov-consumo-out-0-0',
        'mov-consumo-out-0-1',
        'mov-compra-in-0',
      ]);
    });
  });

  describe('filtros', () => {
    it('filtra por lote, tipo y referencia', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([COMPRA_MOVEMENT, CONSUMO_MOVEMENT, MERMA_MOVEMENT]),
      );

      const result = await mockMovementsRepository.list({
        batchId: 'lot-1',
        movementType: 'out',
        referenceId: 'order-9',
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        batchId: 'lot-1',
        movementType: 'out',
        referenceId: 'order-9',
      });
    });

    it('filtra por rango de fechas', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([COMPRA_MOVEMENT, CONSUMO_MOVEMENT, MERMA_MOVEMENT]),
      );

      const result = await mockMovementsRepository.list({
        from: '2026-11-02T00:00:00.000Z',
        to: '2026-11-02T23:59:59.999Z',
      });

      expect(result).toHaveLength(2);
      expect(result.every((m) => m.id.startsWith('mov-consumo'))).toBe(true);
    });

    it('aplica el límite después de ordenar', async () => {
      vi.spyOn(mockService, 'getSnapshot').mockReturnValue(
        snapshot([COMPRA_MOVEMENT, CONSUMO_MOVEMENT, MERMA_MOVEMENT]),
      );

      const result = await mockMovementsRepository.list({ limit: 1 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mov-merma-waste-lot-2');
    });
  });

  describe('suscripción', () => {
    it('delega en mockService.subscribe y permite desuscribirse', () => {
      const listener = vi.fn();
      const unsubscribe = vi.fn();
      const subscribeSpy = vi
        .spyOn(mockService, 'subscribe')
        .mockReturnValue(unsubscribe);

      const result = mockMovementsRepository.subscribe!(listener);

      expect(subscribeSpy).toHaveBeenCalledTimes(1);
      result();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });
});
