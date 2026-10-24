/**
 * Implementación mock del repositorio de proveedores (dev sin backend).
 *
 * Estrategia: SOLO LECTURA.
 *
 *   - list() y getById() leen de `mockService.getProveedores()`.
 *   - create() / update() / remove() rechazan con un Error accionable.
 *
 * Nota sobre el estilo de los métodos de escritura:
 *   No se declaran `async` porque no hay `await` dentro (el cuerpo solo
 *   rechaza). Devolver `Promise.reject(...)` mantiene el contrato del
 *   repositorio (siempre devuelve una Promise que puede rechazarse)
 *   sin disparar SonarCloud: "Async method has no 'await' expression".
 */

import { mockService } from '../inventory/mockService.js';
import type {
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
  SuppliersRepository,
} from './types';

interface MockProveedor {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
}

function mapMockProveedor(raw: MockProveedor): Supplier {
  return {
    id: raw.id,
    name: raw.name,
    contactName: raw.contactName,
    phone: raw.phone,
  };
}

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

  create(_input: SupplierInput): Promise<Supplier> {
    return Promise.reject(new Error(READ_ONLY_ERROR));
  },

  update(_id: string, _input: SupplierUpdateInput): Promise<Supplier> {
    return Promise.reject(new Error(READ_ONLY_ERROR));
  },

  remove(_id: string): Promise<void> {
    return Promise.reject(new Error(READ_ONLY_ERROR));
  },
};