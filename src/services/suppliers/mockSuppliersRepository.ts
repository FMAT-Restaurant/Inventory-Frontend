/**
 * Implementación mock del repositorio de proveedores (dev sin backend).
 *
 * Estrategia: SOLO LECTURA.
 *
 * El mockService en memoria (`src/services/inventory/mockService.js`) tiene
 * proveedores de ejemplo en `initialData.js`, pero no expone operaciones de
 * escritura para ellos. En vez de inventar un CRUD parcial en el mock (que
 * quedaría huérfano cuando el otro equipo construya la UI de suppliers),
 * este repositorio:
 *
 *   - Lee de `mockService.getProveedores()` y MAPEA los campos del mock
 *     (español: nombre, contacto, telefono) al tipo `Supplier` del frontend
 *     (inglés: name, contactName, phone).
 *   - Las operaciones de escritura (`create`, `update`, `remove`) lanzan un
 *     Error claro y accionable. Esto es intencional: si el otro equipo
 *     construye la UI y quiere probar el flujo completo en modo mock, debe
 *     configurar `VITE_USE_MOCK=false` + `VITE_API_URL` y correr el backend.
 *     Extender este mock con escritura es trabajo de un PR aparte (ver
 *     `test/mockService.test.js` para el patrón de escritura en el mock de
 *     inventario).
 *
 * Por qué no usamos `as Supplier` como en `mockIngredientsRepository.listSuppliers`:
 * ese cast es un bug latente (el mock devuelve `nombre`, no `name`). Aquí
 * hacemos el mapeo explícito y correcto.
 */

import { mockService } from '../inventory/mockService.js';
import type {
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
  SuppliersRepository,
} from './types';

/**
 * Forma de un proveedor en el mock de inventario (`initialData.js`).
 * Nótese la nomenclatura en español.
 */
export interface MockProveedor {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
}

/**
 * Mapea un proveedor del mock (español) al tipo `Supplier` del frontend (inglés).
 * Los campos que el mock NO tiene (`email`, `address`) quedan `undefined`.
 */
function mapMockProveedor(raw: MockProveedor): Supplier {
  return {
    id: raw.id,
    name: raw.name,
    contactName: raw.contactName,
    phone: raw.phone,
  };
}

/** Mensaje único para todas las escrituras, para no duplicar strings. */
const READ_ONLY_ERROR =
  'Operación no disponible en modo mock. Configura VITE_USE_MOCK=false y VITE_API_URL para usar el backend real.';

export const mockSuppliersRepository: SuppliersRepository = {
  async list(): Promise<Supplier[]> {
    const raw = (await mockService.getProveedores()) as MockProveedor[];
    return raw.map(mapMockProveedor);
  },

  async getById(id: string): Promise<Supplier | null> {
    const all = await this.list();
    return all.find((s) => s.id === id) ?? null;
  },

  async create(_input: SupplierInput): Promise<Supplier> {
    throw new Error(READ_ONLY_ERROR);
  },

  async update(_id: string, _input: SupplierUpdateInput): Promise<Supplier> {
    throw new Error(READ_ONLY_ERROR);
  },

  async remove(_id: string): Promise<void> {
    throw new Error(READ_ONLY_ERROR);
  },
};