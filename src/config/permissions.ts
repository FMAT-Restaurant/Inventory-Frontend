/**
 * Catálogo de permisos del módulo de inventario.
 *
 * Espejo del catálogo del backend (Inventory-Backend) y del MS de Auth.
 * Formato: `inventory:<entidad>:<acción>`.
 *
 * IMPORTANTE: las cadenas deben coincidir exactamente con las emitidas
 * por el servidor de autenticación (claims `permissions` del JWT).
 */
export const PERMISSIONS = {
  ITEMS_READ: 'inventory:items:read',
  ITEMS_WRITE: 'inventory:items:write',
  BATCHES_READ: 'inventory:batches:read',
  BATCHES_WRITE: 'inventory:batches:write',
  SUPPLIERS_READ: 'inventory:suppliers:read',
  SUPPLIERS_WRITE: 'inventory:suppliers:write',
  RECIPES_READ: 'inventory:recipes:read',
  RESERVATIONS_READ: 'inventory:reservations:read',
  MOVEMENTS_READ: 'inventory:movements:read',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Permiso de lectura requerido para cada tab/módulo del menú principal.
 * Un módulo sin permiso de lectura se oculta del menú y no se puede abrir.
 */
export const MODULE_READ_PERMISSION: Record<string, Permission> = {
  items: PERMISSIONS.ITEMS_READ,
  batches: PERMISSIONS.BATCHES_READ,
  proveedores: PERMISSIONS.SUPPLIERS_READ,
  recetas: PERMISSIONS.RECIPES_READ,
  movimientos: PERMISSIONS.MOVEMENTS_READ,
};
