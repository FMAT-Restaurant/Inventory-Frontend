/**
 * Helpers compartidos para manejar respuestas paginadas del backend.
 */

import type { PaginatedResponse } from "./types";

/**
 * Límite máximo de `limit` aceptado por el backend en los endpoints
 * paginados. Validación: "limit must not be greater than 100".
 */
export const MAX_PAGE_LIMIT = 100;

/**
 * Acota un `limit` al máximo permitido por el backend. Devuelve `undefined`
 * si no se pasó valor (para omitir el query param y usar el default del API).
 */
export function clampLimit(limit?: number): number | undefined {
  if (limit === undefined || limit === null) return undefined;
  const safe = Math.max(1, Math.trunc(limit) || 1);
  return Math.min(safe, MAX_PAGE_LIMIT);
}

/**
 * Normaliza una respuesta paginada del backend. Si el servidor devuelve
 * un array (caso legacy) lo envuelve como una página única, y si
 * devuelve un objeto con `items` lo sanea numéricamente.
 */
export function toPaginated<T>(
  raw: unknown,
  fallbackPage = 1,
  fallbackLimit = 20,
): PaginatedResponse<T> {
  if (Array.isArray(raw)) {
    const items = raw as T[];
    return {
      items,
      total: items.length,
      page: fallbackPage,
      limit: fallbackLimit,
      totalPages: 1,
    };
  }

  const obj = (raw ?? {}) as Partial<PaginatedResponse<T>>;
  const items = Array.isArray(obj.items) ? (obj.items as T[]) : [];
  const total = Number(obj.total ?? items.length);
  const page = Math.max(1, Number(obj.page ?? fallbackPage));
  const limit = Math.max(1, Number(obj.limit ?? fallbackLimit));
  const rawTotalPages = Number(obj.totalPages);
  const totalPages =
    Number.isFinite(rawTotalPages) && rawTotalPages >= 1
      ? Math.trunc(rawTotalPages)
      : Math.max(1, Math.ceil(total / limit) || 1);

  return { items, total, page, limit, totalPages };
}

/**
 * Construye un query string a partir de un objeto, omitiendo valores
 * undefined, null o strings vacíos.
 */
export function buildQueryString(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Recorre todas las páginas de un endpoint paginado respetando el límite
 * máximo del backend (`limit <= 100`) y devuelve el conjunto completo.
 *
 * Útil para "lookups" (mapa de proveedores, selector de insumos, agrupar
 * lotes) donde necesitamos todos los registros, no solo una página.
 *
 * `maxPages` acota el loop por seguridad: si el backend reporta un
 * `totalPages` inconsistente, no nos quedamos pidiendo páginas infinito.
 */
export async function fetchAllPages<T>(
  fetcher: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  { limit = MAX_PAGE_LIMIT, maxPages = 50 }: { limit?: number; maxPages?: number } = {},
): Promise<T[]> {
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit) || 1), MAX_PAGE_LIMIT);
  const collected: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await fetcher(page, safeLimit);
    collected.push(...res.items);
    if (page >= res.totalPages || res.items.length === 0) break;
  }
  return collected;
}

/**
 * Aplica paginación en memoria a una lista, simulando el contrato
 * paginado del backend. Se usa en los mock repositorios.
 */
export function paginateInMemory<T>(
  all: readonly T[],
  page = 1,
  limit = 20,
): PaginatedResponse<T> {
  const safePage = Math.max(1, Math.trunc(page) || 1);
  const safeLimit = Math.max(1, Math.trunc(limit) || 1);
  const total = all.length;
  const start = (safePage - 1) * safeLimit;
  const items = all.slice(start, start + safeLimit) as T[];
  const totalPages = Math.max(1, Math.ceil(total / safeLimit));
  return { items, total, page: safePage, limit: safeLimit, totalPages };
}
