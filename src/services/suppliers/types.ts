/**
 * Tipos del dominio de proveedores expuestos a la UI.
 *
 * Este archivo es la FUENTE ÚNICA DE VERDAD del dominio `Supplier` en el frontend.
 * Cualquier otro módulo que necesite `Supplier` (por ejemplo, el dropdown
 * "Proveedor sugerido" del formulario de insumos) debe importarlo de aquí,
 * NO declarar su propia versión.
 *
 * Contrato con el backend (ver `supplier.schema.ts` en NestJS):
 *   - El backend expone `_id` (ObjectId de MongoDB) como string de 24 hex.
 *     El frontend SIEMPRE trabaja con `id` (sin guion bajo), y la conversión
 *     la hace `httpSuppliersRepository`.
 *   - El backend añade `createdAt`, `updatedAt` y `__v` (versión de Mongoose).
 *     La UI solo necesita `createdAt`/`updatedAt` de forma opcional; `__v` se
 *     descarta.
 */

/**
 * Proveedor tal como lo consume la UI.
 *
 * Todos los campos excepto `id` y `name` son opcionales porque el schema
 * de Mongoose los declara como `required: false` y el DTO de creación los
 * marca `@IsOptional()`. Un proveedor creado solo con `{ name: "X" }` es
 * válido según el backend.
 */
export interface Supplier {
  /** Identificador del proveedor. En el backend es `_id`; aquí siempre `id`. */
  id: string;
  /** Nombre del proveedor. Campo único en el backend (E11000 si se duplica). */
  name: string;
  /** Nombre de la persona de contacto (opcional). */
  contactName?: string;
  /** Teléfono de contacto (opcional). */
  phone?: string;
  /** Correo electrónico (opcional). El backend valida formato con `@IsEmail()`. */
  email?: string;
  /** Dirección física (opcional). */
  address?: string;
  /** ISO-8601. Presente solo si el backend lo envía (siempre lo hará en GET). */
  createdAt?: string;
  /** ISO-8601. Ídem. */
  updatedAt?: string;
}

/**
 * Payload para crear un proveedor (`POST /suppliers`).
 *
 * No incluye `id` porque lo genera MongoDB.
 * `name` es obligatorio y único; el resto opcionales.
 *
 * El backend usa `ValidationPipe` con `whitelist: true` y
 * `forbidNonWhitelisted: true`, así que ENVIAR CAMPOS EXTRA produce 400.
 * Mantén este tipo sincronizado con `CreateSupplierDto` del backend.
 */
export interface SupplierInput {
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
}

/**
 * Payload para actualizar parcialmente un proveedor (`PATCH /suppliers/:id`).
 *
 * Es `Partial<SupplierInput>` porque el backend usa `PartialType(CreateSupplierDto)`
 * en `UpdateSupplierDto`: todos los campos son opcionales. Enviar `{}` es válido
 * y devuelve el documento sin cambios.
 *
 * Nota: hoy la UI no expone edición de proveedores, pero el repo debe soportarlo
 * porque el backend ya lo tiene y otro equipo lo va a necesitar.
 */
export type SupplierUpdateInput = Partial<SupplierInput>;

/**
 * Contrato único de acceso a datos de proveedores.
 *
 * Implementado por:
 *   - `httpSuppliersRepository` (qa/prod) → habla con el backend NestJS.
 *   - `mockSuppliersRepository` (dev sin backend) → lee del mockService.
 *
 * Reglas de la interfaz:
 *   - `list()` y `getById()` NUNCA lanzan por "no encontrado": `list` devuelve
 *     un array (posiblemente vacío) y `getById` devuelve `null`. Solo lanzan
 *     ante errores reales (red, 500, etc.).
 *   - `create/update/remove` SÍ lanzan `Error` ante fallos del backend
 *     (400, 404, 409, red). El mensaje del `Error` es el `message` del
 *     backend cuando está disponible, para que la UI lo muestre tal cual.
 *   - El repo es stateless: no cachea. El caché es responsabilidad del hook
 *     (`useSuppliers`) o del componente que lo consuma.
 */
export interface SuppliersRepository {
  list(): Promise<Supplier[]>;
  getById(id: string): Promise<Supplier | null>;
  create(input: SupplierInput): Promise<Supplier>;
  update(id: string, input: SupplierUpdateInput): Promise<Supplier>;
  remove(id: string): Promise<void>;
}