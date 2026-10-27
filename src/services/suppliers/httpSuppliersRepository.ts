/**
 * Implementación HTTP del repositorio de proveedores (qa/prod).
 *
 * Contrato REST asumido con el backend NestJS (base = ENV.API_URL):
 *   GET    /suppliers          -> SupplierRaw[]    (200)
 *   GET    /suppliers/:id      -> SupplierRaw      (200) | 404
 *   POST   /suppliers          (SupplierInput) -> SupplierRaw  (201) | 400 | 409
 *   PATCH  /suppliers/:id      (SupplierUpdateInput) -> SupplierRaw (200) | 400 | 404
 *   DELETE /suppliers/:id      -> void             (200) | 404
 *
 * El backend devuelve `_id` (ObjectId de Mongo) y `__v` (versión de Mongoose).
 * Este repositorio NORMALIZA la respuesta: `_id -> id`, descarta `__v`.
 *
 * El backend responde errores con la forma:
 *   { statusCode: number, message: string | string[], error: string }
 *
 * Deuda técnica conocida:
 *   La función `request()` está duplicada respecto a
 *   `services/items/httpItemsRepository.ts`. Está previsto
 *   extraerla a `services/http/request.ts` en un PR posterior, coordinado
 *   con el dueño del dominio `items`. Ver `README.md` del módulo.
 */

import { ENV } from '../../config/env';
import type {
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
  SuppliersRepository,
} from './types';

interface RawSupplier {
  _id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

function normalizeSupplier(raw: RawSupplier): Supplier {
  const { _id, __v, ...rest } = raw;
  return {
    id: String(_id),
    ...rest,
  };
}

/**
 * Helper HTTP genérico. Duplicado respecto a
 * `services/items/httpItemsRepository.ts`; ver deuda técnica
 * documentada arriba.
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${ENV.API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = '';
    try {
      const body = (await response.json()) as {
        message?: string | string[];
        error?: string;
      };
      const message = body?.message;
      if (Array.isArray(message)) {
        detail = message.join('; ');
      } else if (typeof message === 'string') {
        detail = message;
      } else if (typeof body?.error === 'string') {
        detail = body.error;
      }
    } catch {
      detail = '';
    }
    throw new Error(detail || `Error ${response.status} al consumir ${path}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const httpSuppliersRepository: SuppliersRepository = {
  async list(): Promise<Supplier[]> {
    const raw = await request<RawSupplier[]>('/suppliers');
    return raw.map(normalizeSupplier);
  },

  async getById(id: string): Promise<Supplier | null> {
    try {
      const raw = await request<RawSupplier>(`/suppliers/${id}`);
      return normalizeSupplier(raw);
    } catch {
      return null;
    }
  },

  async create(input: SupplierInput): Promise<Supplier> {
    const raw = await request<RawSupplier>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return normalizeSupplier(raw);
  },

  async update(id: string, input: SupplierUpdateInput): Promise<Supplier> {
    const raw = await request<RawSupplier>(`/suppliers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
    return normalizeSupplier(raw);
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/suppliers/${id}`, { method: 'DELETE' });
  },
};