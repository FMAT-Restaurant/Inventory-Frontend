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
 * Este repositorio NORMALIZA la respuesta: `_id -> id`, descarta `__v`, y
 * convierte cualquier respuesta en un objeto `Supplier` del frontend.
 *
 * El backend responde errores con la forma:
 *   { statusCode: number, message: string | string[], error: string }
 * `request()` extrae `message` para propagarlo como `Error.message`, que es
 * lo que la UI muestra al usuario.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TODO(refactor): extraer `request<T>` a `services/http/request.ts` cuando
 * `services/ingredients/httpIngredientsRepository.ts` y este archivo estén
 * estables en `main`, para eliminar la duplicación (~30 líneas). Coordinar
 * con el dueño del dominio `ingredients` antes de mover el archivo.
 * ─────────────────────────────────────────────────────────────────────
 */

import { ENV } from '../../config/env';
import type {
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
  SuppliersRepository,
} from './types';

/**
 * Forma CRUDA que devuelve el backend (antes de normalizar).
 * - `_id` es el ObjectId de Mongo serializado como string de 24 hex.
 * - `__v` es la versión interna de Mongoose (ruido para la UI).
 */
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

/**
 * Normaliza un documento del backend al tipo `Supplier` del frontend:
 * - `_id` -> `id`
 * - descarta `__v`
 * - conserva `createdAt`/`updatedAt` si vienen
 */
function normalizeSupplier(raw: RawSupplier): Supplier {
  const { _id, __v, ...rest } = raw;
  return {
    id: String(_id),
    ...rest,
  };
}

/**
 * Helper HTTP genérico. Duplicado a propósito desde
 * `services/ingredients/httpIngredientsRepository.ts` (ver TODO arriba).
 *
 * Reglas:
 * - Añade `Content-Type: application/json` en toda petición (incluida GET,
 *   para evitar problemas con proxies que exigen Content-Type).
 * - Si `response.ok` es false, intenta extraer `message` del body JSON del
 *   backend y lo lanza como `Error`. Si el body no es JSON, lanza un
 *   mensaje genérico con el status code.
 * - Si el status es 204, devuelve `undefined` (convención de `void`).
 * - En otro caso, parsea y devuelve el JSON.
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
      // 404, id inválido, o cualquier error: devolvemos null para que la UI
      // decida cómo manejar el "no encontrado" sin try/catch.
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
    // PATCH (no PUT): el backend expone `@Patch(':id')`, no `@Put`.
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