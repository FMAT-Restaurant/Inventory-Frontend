/**
 * Repositorio de ingredientes para el ambiente de desarrollo (dev).
 *
 * No inventa una fuente de datos nueva: reutiliza el `mockService` existente
 * (store en memoria compartido) para mantener una única fuente de verdad con
 * las demás vistas (Insumos, Recetas, Movimientos).
 */

import { mockService } from '../inventory/mockService.js';
import type { Ingredient, IngredientsRepository, Supplier } from './types';

export const mockIngredientsRepository: IngredientsRepository = {
  async list(): Promise<Ingredient[]> {
    const items = await mockService.getIngredientes();
    return (items as unknown as Ingredient[]).map(item => ({ ...item }));
  },

  async getById(id: string): Promise<Ingredient | null> {
    try {
      const ingredient = await mockService.getIngredientePorId(id);
      return ingredient ? ({ ...ingredient } as unknown as Ingredient) : null;
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
