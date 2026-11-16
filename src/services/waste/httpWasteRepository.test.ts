import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpWasteRepository } from './httpWasteRepository';
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

  it('envía solo lote, cantidad y motivo con POST /movements/waste', async () => {
    fetchMock.mockResolvedValue(mockResponse({ id: 'm1' }, 201));

    await httpWasteRepository.register({
      batchId: 'B1',
      quantity: 2,
      reason: '  Se cayó  ',
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toContain('/movements/waste');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      batchId: 'B1',
      quantity: 2,
      reason: 'Se cayó',
    });
  });

  it('propaga el mensaje del backend cuando rechaza la merma', async () => {
    fetchMock.mockResolvedValue(
      mockResponse(
        { message: 'La merma excede la cantidad del lote (disponible: 1)' },
        422,
      ),
    );

    await expect(
      httpWasteRepository.register({ batchId: 'B1', quantity: 5, reason: 'x' }),
    ).rejects.toThrow('La merma excede la cantidad del lote');
  });
});

describe('validateWasteInput', () => {
  const valid = { batchId: 'B1', quantity: 1, reason: 'x' };

  it('acepta una merma válida dentro de lo que queda en el lote', () => {
    expect(validateWasteInput(valid, 5)).toBeNull();
  });

  it.each([
    [{ ...valid, batchId: '' }, 'lote'],
    [{ ...valid, quantity: 0 }, 'mayor a 0'],
    [{ ...valid, reason: '   ' }, 'motivo'],
  ])('rechaza %j', (input, message) => {
    expect(validateWasteInput(input, 5)).toContain(message);
  });

  it('rechaza una cantidad mayor a la que queda en el lote', () => {
    expect(validateWasteInput({ ...valid, quantity: 6 }, 5)).toContain('excede');
  });
});
