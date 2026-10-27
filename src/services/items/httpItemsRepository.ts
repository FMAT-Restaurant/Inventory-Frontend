/**
 * Implementación HTTP del repositorio de items para qa/prod.
 *
 * Contrato REST asumido (base = VITE_API_URL):
 *   GET    /items          -> Item[]
 *   GET    /items/:id      -> Item
 *   POST   /items          (CreateItemDto) -> Item
 *   PATCH  /items/:id      (Partial<CreateItemDto>) -> Item
 *   DELETE /items/:id      -> Item desactivado
 *   GET    /suppliers      -> Proveedor[]
 *
 * Campos exigidos por el backend: sku, name, category, unit, minStock y
 * storageCondition. Opcionales: description, isPerishable, averageCost y
 * supplierIdSugested.
 */

import { ENV } from "../../config/env";
import type { Item, ItemInput, ItemsRepository, Supplier } from "./types";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${ENV.API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.message || body?.error || "";
    } catch {
      detail = "";
    }
    throw new Error(detail || `Error ${response.status} al consumir ${path}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined as T;
  }

  return JSON.parse(raw) as T;
}

/**
 * Construye el payload del backend a partir del formulario de la UI.
 * Se descartan los campos opcionales vacíos para no enviar datos sin sentido.
 */
function toPayload(input: ItemInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    sku: input.sku.trim(),
    name: input.name.trim(),
    description: input.description?.trim() ?? "",
    category: input.category.trim() || "General",
    unit: input.unit.trim(),
    minStock: input.minStock,
    isPerishable: Boolean(input.isPerishable),
    storageCondition: input.storageCondition.trim(),
    supplierIdSugested: input.supplierIdSugested || null,
  };

  if (input.averageCost !== undefined && input.averageCost > 0) {
    payload.averageCost = input.averageCost;
  }

  return payload;
}

/**
 * Normaliza la respuesta del backend para que la UI siempre reciba
 * los mismos campos, sin importar si el servidor omitió opcionales.
 */
function normalizeItem(item: Item & { _id?: string }): Item {
  return {
    ...item,
    id: item.id || item._id || "",
    description: item.description ?? "",
    isPerishable: item.isPerishable ?? false,
    storageCondition: item.storageCondition ?? "",
    category: item.category || "General",
    averageCost: item.averageCost ?? 0,
    supplierIdSugested: item.supplierIdSugested ?? null,
    totalStock: item.totalStock ?? 0,
    reservedStock: item.reservedStock ?? 0,
    availableStock: item.availableStock ?? 0,
  };
}

export const httpItemsRepository: ItemsRepository = {
  async list() {
    const items = await request<(Item & { _id?: string })[]>("/items");
    return items.map(normalizeItem);
  },

  async getById(id) {
    try {
      const item = await request<Item & { _id?: string }>(`/items/${id}`);
      return normalizeItem(item);
    } catch {
      return null;
    }
  },

  create(input) {
    return request<Item>("/items", {
      method: "POST",
      body: JSON.stringify(toPayload(input)),
    });
  },

  update(id, input) {
    return request<Item>(`/items/${id}`, {
      method: "PATCH",
      body: JSON.stringify(toPayload(input)),
    });
  },

  async remove(id) {
    await request<void>(`/items/${id}`, { method: "DELETE" });
  },

  listSuppliers() {
    return request<Supplier[]>("/suppliers");
  },
};
