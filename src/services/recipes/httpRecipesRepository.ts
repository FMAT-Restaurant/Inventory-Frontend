/**
 * Implementación HTTP del repositorio de recetas para qa/prod.
 *
 * Contrato REST consumido (base = VITE_API_URL):
 *   GET    /recipes                  -> Recipe[] (soporta ?available=true/false)
 *   GET    /recipes/:id              -> Recipe (por ObjectId o plateId)
 *   POST   /recipes                  (CreateRecipeDto) -> 201 (nueva) o 200 (upsert)
 *   PATCH  /recipes/:id              (UpdateRecipeDto) -> Recipe
 *   DELETE /recipes/:id              -> 200 / 204
 */

import { ENV } from "../../config/env";
import type {
  CreateRecipeInput,
  QueryRecipesParams,
  Recipe,
  RecipeItem,
  RecipeSaveResult,
  RecipesRepository,
  UpdateRecipeInput,
} from "./types";

interface RawRecipeItem {
  ingredientId: string;
  ingredientName?: string;
  unit?: string;
  requiredQuantity: number;
  availableStock?: number;
  hasSufficientStock?: boolean;
}

interface RawRecipe {
  id?: string;
  _id?: string;
  plateId: string;
  name: string;
  isAvailable?: boolean;
  maxPreparablePortions?: number;
  productionCost?: number;
  items?: RawRecipeItem[];
  createdAt?: string;
  updatedAt?: string;
}

function normalizeRecipeItem(raw: RawRecipeItem): RecipeItem {
  return {
    ingredientId: String(raw.ingredientId ?? ""),
    ingredientName: String(raw.ingredientName ?? ""),
    unit: String(raw.unit ?? ""),
    requiredQuantity: Number(raw.requiredQuantity ?? 0),
    availableStock: Number(raw.availableStock ?? 0),
    hasSufficientStock: Boolean(raw.hasSufficientStock),
  };
}

function normalizeRecipe(raw: RawRecipe): Recipe {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    plateId: String(raw.plateId ?? ""),
    name: String(raw.name ?? ""),
    isAvailable: Boolean(raw.isAvailable),
    maxPreparablePortions: Number(raw.maxPreparablePortions ?? 0),
    productionCost: Number(raw.productionCost ?? 0),
    items: Array.isArray(raw.items) ? raw.items.map(normalizeRecipeItem) : [],
    createdAt: raw.createdAt ? String(raw.createdAt) : undefined,
    updatedAt: raw.updatedAt ? String(raw.updatedAt) : undefined,
  };
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; status: number }> {
  let response: Response;
  try {
    response = await fetch(`${ENV.API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      },
    });
  } catch {
    throw new Error(
      `No se pudo conectar con el servidor backend en ${ENV.API_URL}. Verifica que el servicio esté en ejecución.`,
    );
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message || body?.error || "";
    } catch {
      detail = "";
    }

    if (response.status === 404) {
      throw new Error(
        detail || "La receta o uno de sus ingredientes no fue encontrado (404).",
      );
    }
    if (response.status === 400) {
      throw new Error(
        detail || "Los datos de la receta son inválidos o incompletos (400).",
      );
    }
    if (response.status === 409) {
      throw new Error(
        detail || "Conflicto: El identificador plateId ya existe (409).",
      );
    }

    throw new Error(
      detail || `Error ${response.status} al realizar petición a ${path}`,
    );
  }

  if (response.status === 204) {
    return { data: undefined as T, status: response.status };
  }

  const raw = await response.text();
  if (!raw) {
    return { data: undefined as T, status: response.status };
  }

  return { data: JSON.parse(raw) as T, status: response.status };
}

export const httpRecipesRepository: RecipesRepository = {
  async list(params?: QueryRecipesParams): Promise<Recipe[]> {
    let query = "";
    if (params?.available !== undefined) {
      query = `?available=${params.available}`;
    }

    const { data } = await request<RawRecipe[]>(`/recipes${query}`);
    return (data ?? []).map(normalizeRecipe);
  },

  async getByIdOrPlateId(idOrPlateId: string): Promise<Recipe | null> {
    try {
      const { data } = await request<RawRecipe>(
        `/recipes/${encodeURIComponent(idOrPlateId)}`,
      );
      return data ? normalizeRecipe(data) : null;
    } catch {
      return null;
    }
  },

  async save(input: CreateRecipeInput): Promise<RecipeSaveResult> {
    const payload = {
      plateId: input.plateId.trim(),
      name: input.name.trim(),
      items: input.items.map((item) => ({
        ingredientId: String(item.ingredientId),
        requiredQuantity: Number(item.requiredQuantity),
      })),
    };

    const { data, status } = await request<RawRecipe>("/recipes", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    return {
      recipe: normalizeRecipe(data),
      isNew: status === 201,
    };
  },

  async update(id: string, input: UpdateRecipeInput): Promise<Recipe> {
    const payload: Record<string, unknown> = {};

    if (input.plateId !== undefined) {
      payload.plateId = input.plateId.trim();
    }
    if (input.name !== undefined) {
      payload.name = input.name.trim();
    }
    if (input.items !== undefined) {
      payload.items = input.items.map((item) => ({
        ingredientId: String(item.ingredientId),
        requiredQuantity: Number(item.requiredQuantity),
      }));
    }

    const { data } = await request<RawRecipe>(
      `/recipes/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(payload),
      },
    );

    return normalizeRecipe(data);
  },

  async remove(id: string): Promise<void> {
    await request<void>(`/recipes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
  },
};
