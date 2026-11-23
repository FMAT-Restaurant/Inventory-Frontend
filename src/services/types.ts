/**
 * Tipos compartidos por los repositorios HTTP/mock.
 */

/**
 * Respuesta paginada genérica que devuelve el backend para
 * los endpoints de listado (GET /items, /batches, /suppliers, /recipes, /movements).
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Parámetros de paginación opcionales para las llamadas list(). */
export interface PaginationParams {
  page?: number;
  limit?: number;
}
