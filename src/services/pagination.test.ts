import { describe, expect, it, vi } from 'vitest';
import { clampLimit, fetchAllPages, MAX_PAGE_LIMIT } from './pagination';
import type { PaginatedResponse } from './types';

function page<T>(items: T[], partial: Partial<PaginatedResponse<T>> = {}): PaginatedResponse<T> {
  return {
    items,
    total: partial.total ?? items.length,
    page: partial.page ?? 1,
    limit: partial.limit ?? items.length,
    totalPages: partial.totalPages ?? 1,
  };
}

describe('clampLimit', () => {
  it('devuelve undefined si no se pasó limit', () => {
    expect(clampLimit(undefined)).toBeUndefined();
  });

  it('acota al máximo del backend', () => {
    expect(clampLimit(1000)).toBe(MAX_PAGE_LIMIT);
    expect(clampLimit(10_000)).toBe(MAX_PAGE_LIMIT);
  });

  it('mantiene valores dentro del rango y normaliza inválidos', () => {
    expect(clampLimit(50)).toBe(50);
    expect(clampLimit(0)).toBe(1);
    expect(clampLimit(-5)).toBe(1);
  });
});

describe('fetchAllPages', () => {
  it('recorre todas las páginas hasta totalPages', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(page(['a', 'b'], { total: 4, page: 1, limit: 2, totalPages: 2 }))
      .mockResolvedValueOnce(page(['c', 'd'], { total: 4, page: 2, limit: 2, totalPages: 2 }));

    const result = await fetchAllPages<string>(fetcher, { limit: 2 });

    expect(result).toEqual(['a', 'b', 'c', 'd']);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(1, 1, 2);
    expect(fetcher).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it('nunca pide un limit mayor al máximo del backend', async () => {
    const fetcher = vi.fn().mockResolvedValue(page(['x'], { total: 1, limit: 1, totalPages: 1 }));

    await fetchAllPages<string>(fetcher, { limit: 5000 });

    expect(fetcher).toHaveBeenCalledWith(1, MAX_PAGE_LIMIT);
  });

  it('se detiene ante una página vacía aunque totalPages diga más', async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(page(['a'], { total: 99, page: 1, limit: 1, totalPages: 99 }))
      .mockResolvedValueOnce(page([], { total: 99, page: 2, limit: 1, totalPages: 99 }));

    const result = await fetchAllPages<string>(fetcher, { limit: 1 });

    expect(result).toEqual(['a']);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('acota por maxPages como red de seguridad', async () => {
    // El backend siempre reporta totalPages alto: no debe looppear infinito.
    const fetcher = vi.fn().mockImplementation((p: number) =>
      Promise.resolve(page([`i${p}`], { total: 1e6, page: p, limit: 1, totalPages: 1e6 })),
    );

    const result = await fetchAllPages<string>(fetcher, { limit: 1, maxPages: 3 });

    expect(result).toEqual(['i1', 'i2', 'i3']);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
