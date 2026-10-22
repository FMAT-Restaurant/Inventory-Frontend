/**
 * Repositorio de ingredientes para el ambiente de desarrollo (dev).
 *
 * No inventa una fuente de datos nueva: reutiliza el `mockService` existente
 * (store en memoria compartido) para mantener una única fuente de verdad con
 * las demás vistas (Insumos, Recetas, Movimientos).
 */

import { mockService } from '../inventory/mockService.js';
import type { Ingredient, IngredientsRepository, Supplier } from './types';

/**
 * Normaliza un ingrediente del almacén en memoria para que siempre tenga
 * la forma que espera la UI, aunque el dato seed no traiga los campos
 * opcionales (descripción, perecedero, condición de almacenamiento).
 */
function normalizeIngredient(item: Record<string, unknown>): Ingredient {
  return {
    ...item,
    description: item.description ?? '',
    isPerishable: item.isPerishable ?? false,
    storageCondition: item.storageCondition ?? '',
  } as Ingredient;
}

export const mockIngredientsRepository: IngredientsRepository = {
  async list(): Promise<Ingredient[]> {
    const items = await mockService.getIngredientes();
    return (items as unknown as Record<string, unknown>[]).map(normalizeIngredient);
  },

  async getById(id: string): Promise<Ingredient | null> {
    try {
      const ingredient = await mockService.getIngredientePorId(id);
      return ingredient ? normalizeIngredient(ingredient as unknown as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  },

  async create(input) {
    const created = (await mockService.guardarIngrediente(input)) as { id: string };
    const consolidated = await this.getById(created.id);
    if (!consolidated) {
      throw new Error('No se pudo recuperar el ingrediente recién creado.');
    }
    return consolidated;
  },

  async update(id, input) {
    await mockService.guardarIngrediente({ ...input, id });
    const consolidated = await this.getById(id);
    if (!consolidated) {
      throw new Error(`Ingrediente no encontrado: ${id}`);
    }
    return consolidated;
  },

  async remove(id) {
    await mockService.eliminarIngrediente(id);
  },

  async listSuppliers() {
    return (await mockService.getProveedores()) as Supplier[];
  },

  subscribe(listener) {
    const unsubscribe = mockService.subscribe(() => listener());
    return () => {
      unsubscribe();
    };
  }
};
