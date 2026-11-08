import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpMovementsRepository } from './httpMovementsRepository';

const RAW_MOVEMENT = {
  _id: '6ad78bd3e87a342c9ebbc822',
  batchId: '6ad78bd3e87a342c9ebbc823',
  movementType: 'in',
  quantity: 10,
  referenceId: 'prov-1',
  reason: 'Alta de lote',
  createdBy: 'system',
  createdAt: '2026-11-01T10:00:00.000Z',
  __v: 0,
};

function mockResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body),
    json: async () => body,
  } as unknown as Response;
}

describe('httpMovementsRepository', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('hace GET a /movements y normaliza _id -> id', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse([RAW_MOVEMENT]));

      const result = await httpMovementsRepository.list();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/movements$/);
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(result).toEqual([
        {
          id: '6ad78bd3e87a342c9ebbc822',
          batchId: '6ad78bd3e87a342c9ebbc823',
          movementType: 'in',
          quantity: 10,
          referenceId: 'prov-1',
          reason: 'Alta de lote',
          createdBy: 'system',
          createdAt: '2026-11-01T10:00:00.000Z',
        },
      ]);
      expect(result[0]).not.toHaveProperty('_id');
      expect(result[0]).not.toHaveProperty('__v');
    });

    it('arma el query string con los filtros recibidos', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse([]));

      await httpMovementsRepository.list({
        batchId: 'batch-1',
        movementType: 'out',
        referenceId: 'order-1',
        from: '2026-11-01T00:00:00.000Z',
        to: '2026-11-30T23:59:59.999Z',
        limit: 20,
      });

      const [url] = fetchMock.mock.calls[0];
      const parsed = new URL(url);
      expect(parsed.pathname).toMatch(/\/movements$/);
      expect(parsed.searchParams.get('batchId')).toBe('batch-1');
      expect(parsed.searchParams.get('movementType')).toBe('out');
      expect(parsed.searchParams.get('referenceId')).toBe('order-1');
      expect(parsed.searchParams.get('from')).toBe('2026-11-01T00:00:00.000Z');
      expect(parsed.searchParams.get('to')).toBe('2026-11-30T23:59:59.999Z');
      expect(parsed.searchParams.get('limit')).toBe('20');
    });

    it('normaliza batchId cuando llega como objeto', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse([
          {
            ...RAW_MOVEMENT,
            batchId: { _id: 'batch-anidado' },
            movementType: 'desconocido',
          },
        ]),
      );

      const result = await httpMovementsRepository.list();

      expect(result[0].batchId).toBe('batch-anidado');
      expect(result[0].movementType).toBe('adjustment');
    });

    it('ordena por fecha descendente', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse([
          { ...RAW_MOVEMENT, _id: 'viejo', createdAt: '2026-11-01T00:00:00.000Z' },
          { ...RAW_MOVEMENT, _id: 'nuevo', createdAt: '2026-11-05T00:00:00.000Z' },
        ]),
      );

      const result = await httpMovementsRepository.list();

      expect(result.map((m) => m.id)).toEqual(['nuevo', 'viejo']);
    });

    it('propaga el message de error del backend', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { statusCode: 500, message: 'Error interno del servidor' },
          { status: 500 },
        ),
      );

      await expect(httpMovementsRepository.list()).rejects.toThrow(
        'Error interno del servidor',
      );
    });

    it('une múltiples mensajes de validación con ", "', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          {
            statusCode: 400,
            message: ['batchId must be a mongodb id', 'limit must be positive'],
          },
          { status: 400 },
        ),
      );

      await expect(httpMovementsRepository.list()).rejects.toThrow(
        'batchId must be a mongodb id, limit must be positive',
      );
    });
  });
});
