/**
 * Constantes y helpers puros para el dominio de proveedores en la UI.
 */

/**
 * Estado inicial del formulario de proveedor.
 * Todos los campos vacíos; `name` es el único requerido por el backend.
 */
export function emptyForm() {
  return {
    id: '',
    name: '',
    contactName: '',
    phone: '',
    email: '',
    address: '',
  };
}

/**
 * Construye el formulario a partir de un `Supplier` ya cargado (para editar).
 */
export function formFromSupplier(supplier) {
  return {
    id: supplier.id,
    name: supplier.name ?? '',
    contactName: supplier.contactName ?? '',
    phone: supplier.phone ?? '',
    email: supplier.email ?? '',
    address: supplier.address ?? '',
  };
}