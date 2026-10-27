/**
 * Repositorio de items para el ambiente de desarrollo (dev).
 *
 * No inventa una fuente de datos nueva: reutiliza el `mockService` existente
 * (store en memoria compartido) para mantener una única fuente de verdad con
 * las demás vistas (Insumos, Recetas, Movimientos).
 */

import { mockService } from '../inventory/mockService.js';
import type { Item, ItemsRepository, Supplier } from './types';

/**
 * Normaliza un item del almacén en memoria para que siempre tenga
 * la forma que espera la UI, aunque el dato seed no traiga los campos
 * opcionales (descripción, perecedero, condición de almacenamiento).
 */
function normalizeItem(item: Record<string, unknown>): Item {
  return {
    ...item,
    description: item.description ?? '',
    isPerishable: item.isPerishable ?? false,
    storageCondition: item.storageCondition ?? '',
  } as Item;
}

export const mockItemsRepository: ItemsRepository = {
  async list(): Promise<Item[]> {
    const items = await mockService.getItems();
    return (items as unknown as Record<string, unknown>[]).map(normalizeItem);
  },

  async getById(id: string): Promise<Item | null> {
    try {
      const item = await mockService.getItemById(id);
      return item ? normalizeItem(item as unknown as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  },

  async create(input) {
    const created = (await mockService.saveItem(input)) as { id: string };
    const consolidated = await this.getById(created.id);
    if (!consolidated) {
      throw new Error('No se pudo recuperar el item recién creado.');
    }
    return consolidated;
  },

  async update(id, input) {
    await mockService.saveItem({ ...input, id });
    const consolidated = await this.getById(id);
    if (!consolidated) {
      throw new Error(`Item no encontrado: ${id}`);
    }
    return consolidated;
  },

  async remove(id) {
    await mockService.deleteItem(id);
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
