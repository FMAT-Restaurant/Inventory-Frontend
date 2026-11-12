import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpWasteRepository } from './httpWasteRepository';
import { httpSuppliersRepository } from '../suppliers/httpSuppliersRepository';
import { validateWasteInput } from '../../pages/movements/hooks/useWaste';

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  };
}

describe('httpWasteRepository', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lista las órdenes servidas desde las reservas consumidas', async () => {
    fetchMock.mockResolvedValue(
      mockResponse([{ orderId: 'O-1', updatedAt: '2026-11-12T10:00:00Z' }]),
    );

    await expect(httpWasteRepository.listServedOrders()).resolves.toEqual([
      { orderId: 'O-1', servedAt: '2026-11-12T10:00:00Z' },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain(
      '/reservations?status=consumed',
    );
  });

  it('calcula por lote lo consumido, la merma previa y lo restante', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url.includes('movementType=out')
        ? mockResponse([
            { batchId: 'B1', quantity: 150 },
            { batchId: 'B1', quantity: 50 },
            { batchId: 'B2', quantity: 10 },
          ])
        : mockResponse([{ batchId: 'B1', quantity: 30 }]),
    );

    const batches = await httpWasteRepository.listConsumedBatches('O-1');

    expect(batches).toEqual([
      { batchId: 'B1', consumed: 200, alreadyWasted: 30, remaining: 170 },
      { batchId: 'B2', consumed: 10, alreadyWasted: 0, remaining: 10 },
    ]);
    expect(fetchMock.mock.calls[0][0]).toContain('referenceId=O-1');
  });

  it('envía la merma con POST /movements/waste', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 'm1' }, 201));

    await httpWasteRepository.register({
      orderId: 'O-1',
      batchId: 'B1',
      quantity: 2,
      reason: '  Devuelto  ',
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/movements/waste');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      orderId: 'O-1',
      batchId: 'B1',
      quantity: 2,
      reason: 'Devuelto',
    });
  });

  it('propaga el mensaje del backend cuando rechaza la merma', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        { message: 'Solo se puede registrar merma de órdenes servidas' },
        422,
      ),
    );

    await expect(
      httpWasteRepository.register({
        orderId: 'O-1',
        batchId: 'B1',
        quantity: 1,
        reason: 'x',
      }),
    ).rejects.toThrow('Solo se puede registrar merma de órdenes servidas');
  });
});

describe('validateWasteInput', () => {
  const valid = { orderId: 'O-1', batchId: 'B1', quantity: 1, reason: 'x' };

  it('acepta una merma válida dentro de lo disponible', () => {
    expect(validateWasteInput(valid, 5)).toBeNull();
  });

  it.each([
    [{ ...valid, orderId: '' }, 'orden'],
    [{ ...valid, batchId: '' }, 'lote'],
    [{ ...valid, quantity: 0 }, 'mayor a 0'],
    [{ ...valid, reason: '   ' }, 'motivo'],
  ])('rechaza %j', (input, message) => {
    expect(validateWasteInput(input, 5)).toContain(message);
  });

  it('rechaza una cantidad mayor a la disponible para merma', () => {
    expect(validateWasteInput({ ...valid, quantity: 6 }, 5)).toContain('excede');
  });
});

describe('httpSuppliersRepository.costHistory', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta el historial del proveedor y normaliza los números', async () => {
    fetchMock.mockResolvedValue(
      mockResponse([
        {
          batchId: 'B1',
          batchNumber: 'L-1',
          itemId: 'I1',
          itemName: 'Queso',
          unit: 'g',
          quantity: '300',
          cost: '0.5',
          purchasedAt: '2026-11-01T00:00:00Z',
        },
      ]),
    );

    const history = await httpSuppliersRepository.costHistory('S-1');

    expect(fetchMock.mock.calls[0][0]).toContain('/suppliers/S-1/cost-history');
    expect(history).toEqual([
      expect.objectContaining({ batchNumber: 'L-1', quantity: 300, cost: 0.5 }),
    ]);
  });
});
