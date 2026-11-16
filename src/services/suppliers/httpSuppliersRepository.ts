/**
 * Implementación HTTP del repositorio de proveedores (qa/prod).
 *
 * Contrato REST asumido con el backend NestJS (base = ENV.API_URL):
 *   GET    /suppliers          -> SupplierRaw[]    (200)
 *   GET    /suppliers/:id      -> SupplierRaw      (200) | 404
 *   POST   /suppliers          (SupplierInput) -> SupplierRaw  (201) | 400 | 409
 *   PATCH  /suppliers/:id      (SupplierUpdateInput) -> SupplierRaw (200) | 400 | 404
 *   DELETE /suppliers/:id      -> void             (200) | 404
 *   GET    /suppliers/:id/cost-history?itemId&from&to&order&page&limit
 *                              -> SupplierCostHistoryPage (200) | 400 | 404
 *
 * El backend devuelve `_id` (ObjectId de Mongo) y `__v` (versión de Mongoose).
 * Este repositorio NORMALIZA la respuesta: `_id -> id`, descarta `__v`.
 *
 * El backend responde errores con la forma:
 *   { statusCode: number, message: string | string[], error: string }
 */

import { request } from '../http/client';
import type {
  Supplier,
  CostHistoryQuery,
  SupplierCostEntry,
  SupplierCostHistoryPage,
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

  async costHistory(
    id: string,
    query: CostHistoryQuery = {},
  ): Promise<SupplierCostHistoryPage> {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    }
    const queryString = params.toString();
    const suffix = queryString ? `?${queryString}` : '';

    const raw = await request<Partial<SupplierCostHistoryPage>>(
      `/suppliers/${encodeURIComponent(id)}/cost-history${suffix}`,
    );

    const items: SupplierCostEntry[] = (raw?.items ?? []).map((entry) => ({
      ...entry,
      quantity: Number(entry.quantity ?? 0),
      cost: Number(entry.cost ?? 0),
      purchasedAt: String(entry.purchasedAt ?? ''),
    }));

    return {
      items,
      total: Number(raw?.total ?? items.length),
      page: Number(raw?.page ?? 1),
      limit: Number(raw?.limit ?? items.length),
      totalPages: Math.max(1, Number(raw?.totalPages ?? 1)),
      filters: { items: raw?.filters?.items ?? [] },
    };
  },
};