/**
 * Implementación HTTP del repositorio de ingredientes para qa/prod.
 *
 * Contrato REST asumido (base = VITE_API_URL):
 *   GET    /ingredients          -> Ingrediente[]
 *   GET    /ingredients/:id      -> Ingrediente
 *   POST   /ingredients          (IngredienteInput) -> Ingrediente
 *   PUT    /ingredients/:id      (IngredienteInput) -> Ingrediente
 *   DELETE /ingredients/:id      -> 204
 *   GET    /suppliers            -> Proveedor[]
 */

import { ENV } from "../../config/env";
import type { Ingredient, IngredientsRepository, Supplier } from "./types";

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

  return (await response.json()) as T;
}

export const httpIngredientsRepository: IngredientsRepository = {
  list() {
    return request<Ingredient[]>("/ingredients");
  },

  async getById(id) {
    try {
      return await request<Ingredient>(`/ingredients/${id}`);
    } catch {
      return null;
    }
  },

  create(input) {
    return request<Ingredient>("/ingredients", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id, input) {
    return request<Ingredient>(`/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
    });
  },

  async remove(id) {
    await request<void>(`/ingredients/${id}`, { method: "DELETE" });
  },

  listSuppliers() {
    return request<Supplier[]>("/suppliers");
  },
};
