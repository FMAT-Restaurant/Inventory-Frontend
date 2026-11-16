import { describe, expect, it } from 'vitest';
import {
  INITIAL_FILTERS,
  hasActiveFilters,
  toRangeQuery,
  validateRange,
} from './useSupplierCostHistory';

describe('useSupplierCostHistory helpers', () => {
  it('parte con la compra más reciente primero y 20 por página', () => {
    expect(INITIAL_FILTERS).toMatchObject({ order: 'desc', limit: 20 });
  });

  it('convierte las fechas locales a instantes que cubren el día completo', () => {
    const { from, to } = toRangeQuery({ from: '2026-11-12', to: '2026-11-12' });

    expect(new Date(from as string).getTime()).toBe(
      new Date('2026-11-12T00:00:00').getTime(),
    );
    expect(new Date(to as string).getTime()).toBe(
      new Date('2026-11-12T23:59:59.999').getTime(),
    );
  });

  it('omite las fechas vacías', () => {
    expect(toRangeQuery({ from: '', to: '' })).toEqual({});
    expect(toRangeQuery({ from: '2026-11-01', to: '' })).toEqual({
      from: new Date('2026-11-01T00:00:00').toISOString(),
    });
  });

  it('valida que la fecha inicial no sea posterior a la final', () => {
    expect(validateRange({ from: '2026-12-01', to: '2026-11-01' })).toMatch(
      /anterior/,
    );
    expect(validateRange({ from: '2026-11-01', to: '2026-11-01' })).toBeNull();
    expect(validateRange({ from: '', to: '2026-11-01' })).toBeNull();
  });

  it('detecta filtros activos sin contar orden ni tamaño de página', () => {
    expect(hasActiveFilters(INITIAL_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...INITIAL_FILTERS, order: 'asc', limit: 50 })).toBe(
      false,
    );
    expect(hasActiveFilters({ ...INITIAL_FILTERS, itemId: 'I1' })).toBe(true);
    expect(hasActiveFilters({ ...INITIAL_FILTERS, from: '2026-11-01' })).toBe(true);
  });
});
