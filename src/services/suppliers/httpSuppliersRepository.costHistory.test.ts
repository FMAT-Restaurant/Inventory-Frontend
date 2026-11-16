import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpSuppliersRepository } from './httpSuppliersRepository';

function mockResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

const RAW_PAGE = {
  items: [
    {
      batchId: 'B2',
      batchNumber: 'L-2',
      itemId: 'I1',
      itemName: 'Queso',
      unit: 'g',
      quantity: '80',
      cost: '0.65',
      purchasedAt: '2026-11-12T10:00:00Z',
    },
  ],
  total: 41,
  page: 2,
  limit: 20,
  totalPages: 3,
  filters: { items: [{ itemId: 'I1', itemName: 'Queso', unit: 'g' }] },
};

describe('httpSuppliersRepository.costHistory', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('consulta sin parámetros cuando no hay filtros', async () => {
    fetchMock.mockResolvedValue(mockResponse(RAW_PAGE));

    await httpSuppliersRepository.costHistory('S-1');

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/suppliers\/S-1\/cost-history$/);
  });

  it('envía filtros, orden y paginación y omite los vacíos', async () => {
    fetchMock.mockResolvedValue(mockResponse(RAW_PAGE));

    await httpSuppliersRepository.costHistory('S-1', {
      itemId: 'I1',
      from: '2026-11-01T06:00:00.000Z',
      to: '',
      order: 'asc',
      page: 2,
      limit: 10,
    });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toMatch(/\/suppliers\/S-1\/cost-history$/);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      itemId: 'I1',
      from: '2026-11-01T06:00:00.000Z',
      order: 'asc',
      page: '2',
      limit: '10',
    });
  });

  it('normaliza los números y devuelve la paginación', async () => {
    fetchMock.mockResolvedValue(mockResponse(RAW_PAGE));

    const result = await httpSuppliersRepository.costHistory('S-1');

    expect(result).toMatchObject({
      total: 41,
      page: 2,
      limit: 20,
      totalPages: 3,
      filters: { items: [{ itemId: 'I1', itemName: 'Queso', unit: 'g' }] },
    });
    expect(result.items).toEqual([
      expect.objectContaining({ batchId: 'B2', quantity: 80, cost: 0.65 }),
    ]);
  });

  it('tolera una respuesta vacía', async () => {
    fetchMock.mockResolvedValue(mockResponse({}));

    await expect(httpSuppliersRepository.costHistory('S-1')).resolves.toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 0,
      totalPages: 1,
      filters: { items: [] },
    });
  });

  it('propaga el mensaje del backend ante un rango de fechas inválido', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        { message: 'La fecha inicial debe ser anterior a la fecha final' },
        400,
      ),
    );

    await expect(
      httpSuppliersRepository.costHistory('S-1', { from: 'b', to: 'a' }),
    ).rejects.toThrow('La fecha inicial debe ser anterior');
  });
});
