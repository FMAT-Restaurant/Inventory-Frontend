/**
 * Implementación MOCK del repositorio de recetas para desarrollo local (dev).
 */

import type {
  CreateRecipeInput,
  QueryRecipesParams,
  Recipe,
  RecipeSaveResult,
  RecipesRepository,
  UpdateRecipeInput,
} from "./types";

const INITIAL_RECIPES: Recipe[] = [
  {
    id: "rec-1",
    plateId: "plate-1",
    name: "Pizza Margarita Clásica",
    isAvailable: true,
    maxPreparablePortions: 55,
    productionCost: 48.9,
    items: [
      {
        ingredientId: "ing-1",
        ingredientName: "Harina de Trigo Extra",
        unit: "kg",
        requiredQuantity: 0.25,
        availableStock: 24.0,
        hasSufficientStock: true,
      },
      {
        ingredientId: "ing-2",
        ingredientName: "Queso Mozzarella",
        unit: "kg",
        requiredQuantity: 0.2,
        availableStock: 12.0,
        hasSufficientStock: true,
      },
      {
        ingredientId: "ing-3",
        ingredientName: "Salsa de Tomate Base",
        unit: "l",
        requiredQuantity: 0.15,
        availableStock: 9.0,
        hasSufficientStock: true,
      },
    ],
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "rec-2",
    plateId: "plate-2",
    name: "Hamburguesa Gourmet FMAT",
    isAvailable: true,
    maxPreparablePortions: 24,
    productionCost: 48.5,
    items: [
      {
        ingredientId: "ing-4",
        ingredientName: "Carne de Res Molida 80/20",
        unit: "kg",
        requiredQuantity: 0.2,
        availableStock: 5.0,
        hasSufficientStock: true,
      },
      {
        ingredientId: "ing-5",
        ingredientName: "Pan Brioche para Hamburguesa",
        unit: "pza",
        requiredQuantity: 1.0,
        availableStock: 24.0,
        hasSufficientStock: true,
      },
      {
        ingredientId: "ing-2",
        ingredientName: "Queso Mozzarella",
        unit: "kg",
        requiredQuantity: 0.05,
        availableStock: 12.0,
        hasSufficientStock: true,
      },
    ],
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  },
  {
    id: "rec-3",
    plateId: "plate-3",
    name: "Focaccia al Olivo",
    isAvailable: true,
    maxPreparablePortions: 76,
    productionCost: 17.25,
    items: [
      {
        ingredientId: "ing-1",
        ingredientName: "Harina de Trigo Extra",
        unit: "kg",
        requiredQuantity: 0.3,
        availableStock: 24.0,
        hasSufficientStock: true,
      },
      {
        ingredientId: "ing-6",
        ingredientName: "Aceite de Oliva Extra Virgen",
        unit: "l",
        requiredQuantity: 0.06,
        availableStock: 6.0,
        hasSufficientStock: true,
      },
    ],
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-01T10:00:00.000Z",
  },
];

let mockStore: Recipe[] = JSON.parse(JSON.stringify(INITIAL_RECIPES));
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

export const mockRecipesRepository: RecipesRepository = {
  async list(params?: QueryRecipesParams): Promise<Recipe[]> {
    let result = [...mockStore];
    if (params?.available !== undefined) {
      result = result.filter((r) => r.isAvailable === params.available);
    }
    return result;
  },

  async getByIdOrPlateId(idOrPlateId: string): Promise<Recipe | null> {
    const found = mockStore.find(
      (r) => r.id === idOrPlateId || r.plateId === idOrPlateId,
    );
    return found ? { ...found } : null;
  },

  async save(input: CreateRecipeInput): Promise<RecipeSaveResult> {
    const existingIndex = mockStore.findIndex(
      (r) => r.plateId.toLowerCase() === input.plateId.trim().toLowerCase(),
    );

    const now = new Date().toISOString();
    const items = input.items.map((i) => ({
      ingredientId: i.ingredientId,
      ingredientName: `Insumo ${i.ingredientId}`,
      unit: "kg",
      requiredQuantity: i.requiredQuantity,
      availableStock: 10,
      hasSufficientStock: true,
    }));

    if (existingIndex !== -1) {
      const updated: Recipe = {
        ...mockStore[existingIndex],
        name: input.name.trim(),
        items,
        updatedAt: now,
      };
      mockStore[existingIndex] = updated;
      notify();
      return { recipe: { ...updated }, isNew: false };
    }

    const newRecipe: Recipe = {
      id: `rec-${Date.now()}`,
      plateId: input.plateId.trim(),
      name: input.name.trim(),
      isAvailable: true,
      maxPreparablePortions: 10,
      productionCost: 35.0,
      items,
      createdAt: now,
      updatedAt: now,
    };

    mockStore.unshift(newRecipe);
    notify();
    return { recipe: { ...newRecipe }, isNew: true };
  },

  async update(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    const idx = mockStore.findIndex(
      (r) => r.id === id || r.plateId.toLowerCase() === id.toLowerCase(),
    );
    if (idx === -1) {
      throw new Error(`Receta no encontrada: ${id}`);
    }

    const current = mockStore[idx];
    const updated: Recipe = {
      ...current,
      plateId: input.plateId ? input.plateId.trim() : current.plateId,
      name: input.name ? input.name.trim() : current.name,
      items: input.items
        ? input.items.map((i) => ({
            ingredientId: i.ingredientId,
            ingredientName: `Insumo ${i.ingredientId}`,
            unit: "kg",
            requiredQuantity: i.requiredQuantity,
            availableStock: 10,
            hasSufficientStock: true,
          }))
        : current.items,
      updatedAt: new Date().toISOString(),
    };

    mockStore[idx] = updated;
    notify();
    return { ...updated };
  },

  async remove(id: string): Promise<void> {
    mockStore = mockStore.filter(
      (r) => r.id !== id && r.plateId.toLowerCase() !== id.toLowerCase(),
    );
    notify();
  },

  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
