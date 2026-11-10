/**
 * Utilidades para mostrar proveedores que pueden estar dados de baja.
 *
 * El backend hace baja lógica de proveedores: un lote o un insumo conserva
 * el proveedor que tenía asignado aunque ya no esté activo, y la UI debe
 * seguir mostrándolo en lugar de sustituirlo por otro.
 */

interface SupplierLike {
  id: string;
  name: string;
  isActive?: boolean;
}

export const REMOVED_SUPPLIER_LABEL = "Proveedor eliminado";

export function isActiveSupplier(supplier: SupplierLike): boolean {
  return supplier.isActive !== false;
}

/** Nombre del proveedor, marcado como eliminado cuando está dado de baja. */
export function supplierLabel(supplier: SupplierLike): string {
  return isActiveSupplier(supplier)
    ? supplier.name
    : `${supplier.name} (eliminado)`;
}

/**
 * Opción extra para un selector cuando el proveedor asignado ya no está
 * entre los activos. Devuelve `null` si no hace falta (sin proveedor o
 * proveedor activo).
 */
export function assignedInactiveOption(
  assignedId: string | null | undefined,
  allSuppliers: SupplierLike[],
): { id: string; label: string } | null {
  if (!assignedId) return null;

  const assigned = allSuppliers.find((supplier) => supplier.id === assignedId);
  if (assigned && isActiveSupplier(assigned)) return null;

  return {
    id: assignedId,
    label: assigned ? supplierLabel(assigned) : REMOVED_SUPPLIER_LABEL,
  };
}
