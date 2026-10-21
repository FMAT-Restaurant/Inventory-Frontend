import { useCallback, useEffect, useMemo, useState } from "react";
import { recipesRepository } from "../../../services/recipes";
import { ingredientsRepository } from "../../../services/ingredients";
import type {
  CreateRecipeInput,
  Recipe,
  RecipeSaveResult,
} from "../../../services/recipes";
import type { Ingredient } from "../../../services/ingredients";
import { MIN_REQUIRED_QUANTITY, type RecipeFilter } from "../constants";

export interface RecipeFilters {
  search: string;
  availability: RecipeFilter;
}

const INITIAL_FILTERS: RecipeFilters = {
  search: "",
  availability: "ALL",
};

export function validateRecipeInput(input: CreateRecipeInput): string | null {
  if (!input.plateId || !input.plateId.trim()) {
    return "El código (plateId) del platillo es obligatorio.";
  }
  if (!input.name || !input.name.trim()) {
    return "El nombre de la receta es obligatorio.";
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return "La receta debe contener al menos un ingrediente o insumo.";
  }

  const ingredientIds = new Set<string>();
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.ingredientId) {
      return `Fila ${i + 1}: Debe seleccionar un ingrediente.`;
    }
    if (ingredientIds.has(item.ingredientId)) {
      return `No puedes agregar el mismo ingrediente más de una vez en la receta.`;
    }
    ingredientIds.add(item.ingredientId);

    if (
      typeof item.requiredQuantity !== "number" ||
      Number.isNaN(item.requiredQuantity) ||
      item.requiredQuantity < MIN_REQUIRED_QUANTITY
    ) {
      return `Fila ${i + 1}: La cantidad requerida debe ser mayor a ${MIN_REQUIRED_QUANTITY}.`;
    }
  }

  return null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Hook reactivo que desacopla la lógica de negocio y de acceso a datos
 * para la gestión de recetas en el frontend.
 */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [availableIngredients, setAvailableIngredients] = useState<
    Ingredient[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecipeFilters>(INITIAL_FILTERS);

  // Cargar ingredientes disponibles para el selector del formulario
  const loadIngredients = useCallback(async () => {
    setLoadingIngredients(true);
    try {
      const items = await ingredientsRepository.list();
      setAvailableIngredients(items);
    } catch (err) {
      console.error("Error al cargar catálogo de ingredientes:", err);
    } finally {
      setLoadingIngredients(false);
    }
  }, []);

  // Cargar recetas del backend
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await recipesRepository.list();
      setRecipes(items);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar las recetas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    void loadIngredients();
  }, [reload, loadIngredients]);

  // Suscripción reactiva si el repositorio la soporta
  useEffect(() => {
    if (!recipesRepository.subscribe) return;
    return recipesRepository.subscribe(() => {
      void reload();
    });
  }, [reload]);

  /**
   * Guarda o actualiza una receta.
   * - Si se proporciona `editingId`, ejecuta PATCH /recipes/:id
   * - Si no se proporciona `editingId`, ejecuta POST /recipes (upsert idempotente por plateId)
   */
  const save = useCallback(
    async (
      input: CreateRecipeInput,
      editingId?: string,
    ): Promise<RecipeSaveResult> => {
      const validationError = validateRecipeInput(input);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setSaving(true);
      setError(null);

      try {
        if (editingId) {
          // Edición dirigida vía PATCH
          const updated = await recipesRepository.update(editingId, input);
          setMessage(`Receta "${input.name}" actualizada exitosamente.`);
          await reload();
          return { recipe: updated, isNew: false };
        }

        // Creación o upsert vía POST
        const result = await recipesRepository.save(input);
        if (result.isNew) {
          setMessage(`Receta "${input.name}" creada exitosamente.`);
        } else {
          setMessage(
            `Receta "${input.name}" (${input.plateId}) ya existía y fue actualizada exitosamente.`,
          );
        }
        await reload();
        return result;
      } catch (err) {
        const msg = errorMessage(err, "No se pudo guardar la receta.");
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  /**
   * Elimina una receta por su id o plateId.
   */
  const remove = useCallback(
    async (idOrPlateId: string) => {
      setSaving(true);
      setError(null);
      try {
        const target = recipes.find(
          (r) => r.id === idOrPlateId || r.plateId === idOrPlateId,
        );
        await recipesRepository.remove(idOrPlateId);
        setMessage(
          target
            ? `Receta "${target.name}" (${target.plateId}) eliminada del catálogo.`
            : "Receta eliminada del catálogo.",
        );
        await reload();
      } catch (err) {
        const msg = errorMessage(err, "No se pudo eliminar la receta.");
        setError(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [recipes, reload],
  );

  const clearMessage = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  const updateFilters = useCallback((partial: Partial<RecipeFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  // Filtrado reactivo en memoria (búsqueda y disponibilidad)
  const filteredRecipes = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return recipes.filter((recipe) => {
      const name = (recipe.name || "").toLowerCase();
      const plateId = (recipe.plateId || "").toLowerCase();
      const matchesSearch =
        search === "" || name.includes(search) || plateId.includes(search);

      if (!matchesSearch) return false;

      if (filters.availability === "AVAILABLE") {
        return recipe.isAvailable === true;
      }
      if (filters.availability === "UNAVAILABLE") {
        return recipe.isAvailable === false;
      }
      return true;
    });
  }, [recipes, filters]);

  return {
    recipes,
    filteredRecipes,
    availableIngredients,
    filters,
    updateFilters,
    loading,
    loadingIngredients,
    saving,
    error,
    message,
    clearMessage,
    reload,
    save,
    remove,
  };
}
