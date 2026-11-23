import { useCallback, useMemo, useState } from "react";
import type { PaginatedResponse } from "../services/types";

/** Props que consume `<PaginationBar>`; se propagan con `{...pagination}`. */
export interface PaginationBarProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  onLimitChange: (next: number) => void;
}

/**
 * Estado de paginación server-side compartido por todas las vistas
 * paginadas (insumos, lotes, recetas, proveedores, movimientos).
 *
 * El hook solo administra `page`/`limit` (entradas) y expone
 * `applyPage` para registrar la info de la respuesta (`total`,
 * `totalPages`). La carga de datos sigue siendo del hook de dominio.
 */
export function usePagination(defaultLimit: number) {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(defaultLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  /** Registra `total`/`totalPages` de la página recién cargada. */
  const applyPage = useCallback((result: PaginatedResponse<unknown>) => {
    setTotal(result.total);
    setTotalPages(result.totalPages);
  }, []);

  const goToPage = useCallback((next: number) => {
    setPage(Math.max(1, Math.trunc(next) || 1));
  }, []);

  /** Cambia el tamaño de página y vuelve a la primera página. */
  const changeLimit = useCallback((next: number) => {
    setLimit(Math.max(1, Math.trunc(next) || 1));
    setPage(1);
  }, []);

  /** Vuelve a la página 1 (tras cambiar filtros de búsqueda). */
  const resetPage = useCallback(() => setPage(1), []);

  const pagination = useMemo<PaginationBarProps>(
    () => ({ page, limit, total, totalPages, onPageChange: goToPage, onLimitChange: changeLimit }),
    [page, limit, total, totalPages, goToPage, changeLimit],
  );

  return {
    page,
    limit,
    total,
    totalPages,
    pagination,
    applyPage,
    goToPage,
    changeLimit,
    resetPage,
  };
}
