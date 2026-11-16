import { useCallback, useEffect, useMemo, useState } from "react";
import { suppliersRepository } from "../../../services/suppliers";
import type {
  CostHistoryQuery,
  SupplierCostHistoryPage,
} from "../../../services/suppliers";

export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 20;

export interface CostHistoryFilters {
  itemId: string;
  /** Fecha local `YYYY-MM-DD` (valor de un input date). */
  from: string;
  to: string;
  order: "desc" | "asc";
  limit: number;
}

export const INITIAL_FILTERS: CostHistoryFilters = {
  itemId: "",
  from: "",
  to: "",
  order: "desc",
  limit: DEFAULT_PAGE_SIZE,
};

const EMPTY_PAGE: SupplierCostHistoryPage = {
  items: [],
  total: 0,
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  filters: { items: [] },
};

/**
 * Convierte las fechas de los inputs (locales) a instantes ISO. Así "hasta el
 * 12/11" incluye las compras de ese día en la zona del usuario, no en UTC.
 */
export function toRangeQuery(
  filters: Pick<CostHistoryFilters, "from" | "to">,
): Pick<CostHistoryQuery, "from" | "to"> {
  const range: Pick<CostHistoryQuery, "from" | "to"> = {};
  if (filters.from) {
    range.from = new Date(`${filters.from}T00:00:00`).toISOString();
  }
  if (filters.to) {
    range.to = new Date(`${filters.to}T23:59:59.999`).toISOString();
  }
  return range;
}

export function validateRange(
  filters: Pick<CostHistoryFilters, "from" | "to">,
): string | null {
  if (filters.from && filters.to && filters.from > filters.to) {
    return "La fecha inicial debe ser anterior o igual a la final.";
  }
  return null;
}

export function hasActiveFilters(filters: CostHistoryFilters): boolean {
  return Boolean(filters.itemId || filters.from || filters.to);
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Historial de costos de un proveedor con filtros, orden y paginación en el
 * servidor. Cambiar un filtro regresa a la primera página; mientras llega una
 * página nueva se conserva la anterior para que la tabla no parpadee.
 */
export function useSupplierCostHistory(supplierId: string | undefined) {
  const [filters, setFilters] = useState<CostHistoryFilters>(INITIAL_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<SupplierCostHistoryPage>(EMPTY_PAGE);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // El selector de insumos no depende de los filtros: se conserva.
  const [itemOptions, setItemOptions] = useState(EMPTY_PAGE.filters.items);

  const rangeError = useMemo(() => validateRange(filters), [filters]);

  // Al abrir otro proveedor se parte de cero.
  useEffect(() => {
    setFilters(INITIAL_FILTERS);
    setPage(1);
    setData(EMPTY_PAGE);
    setItemOptions([]);
    setLoaded(false);
    setError(null);
  }, [supplierId]);

  useEffect(() => {
    if (!supplierId || rangeError) return undefined;

    let cancelled = false;
    setLoading(true);
    setError(null);

    suppliersRepository
      .costHistory(supplierId, {
        itemId: filters.itemId || undefined,
        ...toRangeQuery(filters),
        order: filters.order,
        page,
        limit: filters.limit,
      })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setLoaded(true);
        if (result.filters.items.length > 0) {
          setItemOptions(result.filters.items);
        }
        // El servidor ajusta una página fuera de rango a la última.
        if (result.page !== page) setPage(result.page);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(errorMessage(err, "No se pudo cargar el historial de costos."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [supplierId, filters, page, rangeError]);

  const updateFilters = useCallback((partial: Partial<CostHistoryFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters((prev) => ({ ...INITIAL_FILTERS, limit: prev.limit, order: prev.order }));
    setPage(1);
  }, []);

  const goToPage = useCallback(
    (next: number) => {
      setPage(Math.min(Math.max(1, next), data.totalPages));
    },
    [data.totalPages],
  );

  return {
    data,
    itemOptions,
    filters,
    page,
    loading,
    loaded,
    error,
    rangeError,
    updateFilters,
    clearFilters,
    goToPage,
  };
}
