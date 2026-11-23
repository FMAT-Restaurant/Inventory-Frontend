import { useCallback, useEffect, useMemo, useState } from "react";
import { recipesRepository } from "../../../services/recipes";
import { itemsRepository } from "../../../services/items";
import { fetchAllPages } from "../../../services/pagination";
import type {
  CreateRecipeInput,
  Recipe,
  RecipeSaveResult,
} from "../../../services/recipes";
import type { Item } from "../../../services/items";
import { MIN_REQUIRED_QUANTITY, type RecipeFilter } from "../constants";

export interface RecipeFilters {
  search: string;
  availability: RecipeFilter;
}

const INITIAL_FILTERS: RecipeFilters = {
  search: "",
  availability: "ALL",
};

/** Tamaño de página por defecto para recetas. */
export const DEFAULT_RECIPES_LIMIT = 20;

export function validateRecipeInput(input: CreateRecipeInput): string | null {
  if (!input.plateId || !input.plateId.trim()) {
    return "El código (plateId) del platillo es obligatorio.";
  }
  if (!input.name || !input.name.trim()) {
    return "El nombre de la receta es obligatorio.";
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return "La receta debe contener al menos un insumo.";
  }

  const itemIds = new Set<string>();
  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.itemId) {
      return `Fila ${i + 1}: Debe seleccionar un insumo.`;
    }
    if (itemIds.has(item.itemId)) {
      return `No puedes agregar el mismo insumo más de una vez en la receta.`;
    }
    itemIds.add(item.itemId);

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
 *
 * Paginación server-side sobre el listado de recetas. El filtro
 * `available` viaja al backend; `search` se aplica en memoria sobre la
 * página actual.
 */
export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [availableItems, setAvailableItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<RecipeFilters>(INITIAL_FILTERS);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_RECIPES_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Cargar insumos disponibles para el selector del formulario
  const loadItems = useCallback(async () => {
    setLoadingItems(true);
    try {
      const result = await fetchAllPages((p, l) =>
        itemsRepository.list({ page: p, limit: l }),
      );
      setAvailableItems(result);
    } catch (err) {
      console.error("Error al cargar catálogo de insumos:", err);
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Cargar recetas del backend (paginadas)
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const available =
        filters.availability === "AVAILABLE"
          ? true
          : filters.availability === "UNAVAILABLE"
            ? false
            : undefined;

      const result = await recipesRepository.list({
        available,
        page,
        limit,
      });
      setRecipes(result.items);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar las recetas."));
    } finally {
      setLoading(false);
    }
  }, [filters.availability, page, limit]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

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
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      const resetPage =
        (partial.search !== undefined && partial.search !== prev.search) ||
        (partial.availability !== undefined &&
          partial.availability !== prev.availability);
      if (resetPage) setPage(1);
      return next;
    });
  }, []);

  const goToPage = useCallback((next: number) => {
    setPage(Math.max(1, Math.trunc(next) || 1));
  }, []);

  const changeLimit = useCallback((next: number) => {
    setLimit(Math.max(1, Math.trunc(next) || 1));
    setPage(1);
  }, []);

  /**
   * Búsqueda textual en memoria sobre la página actual (el backend solo
   * expone `available` como filtro). La paginación ya filtró disponibilidad.
   */
  const filteredRecipes = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) return recipes;
    return recipes.filter((recipe) => {
      const name = (recipe.name || "").toLowerCase();
      const plateId = (recipe.plateId || "").toLowerCase();
      return name.includes(search) || plateId.includes(search);
    });
  }, [recipes, filters.search]);

  return {
    recipes,
    filteredRecipes,
    availableItems,
    filters,
    updateFilters,
    loading,
    loadingItems,
    saving,
    error,
    message,
    clearMessage,
    reload,
    save,
    remove,
    page,
    limit,
    total,
    totalPages,
    goToPage,
    changeLimit,
  };
}
