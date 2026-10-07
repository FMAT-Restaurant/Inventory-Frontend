import { useCallback, useEffect, useMemo, useState } from "react";
import { ingredientsRepository } from "../../../services/ingredients";
import type {
  Ingredient,
  IngredientInput,
  Supplier,
} from "../../../services/ingredients";

export interface IngredientFilters {
  search: string;
  category: string;
}

const INITIAL_FILTERS: IngredientFilters = {
  search: "",
  category: "TODAS",
};

export function validateIngredientInput(input: IngredientInput): string | null {
  if (!input.name || !input.name.trim()) {
    return "El nombre del ingrediente es obligatorio.";
  }
  if (!input.unit || !input.unit.trim()) {
    return "Selecciona una unidad de medida.";
  }
  if (Number.isNaN(Number(input.minStock)) || Number(input.minStock) < 0) {
    return "El umbral mínimo debe ser 0 o mayor.";
  }
  return null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Hook que encapsula toda la lógica de negocio y el acceso a datos
 * de la sección de ingredientes. La vista solo consume su resultado.
 */
export function useIngredients() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<IngredientFilters>(INITIAL_FILTERS);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, supplierList] = await Promise.all([
        ingredientsRepository.list(),
        ingredientsRepository.listSuppliers(),
      ]);
      setIngredients(items);
      console.log("Ingredientes cargados:", items);
      console.log("Proveedores cargados:", supplierList);
      setSuppliers(supplierList);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar los ingredientes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!ingredientsRepository.subscribe) return;
    return ingredientsRepository.subscribe(() => {
      void reload();
    });
  }, [reload]);

  const save = useCallback(
    async (input: IngredientInput) => {
      const validationError = validateIngredientInput(input);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setSaving(true);
      setError(null);
      try {
        if (input.id) {
          await ingredientsRepository.update(input.id, input);
          setMessage(`Ingrediente "${input.name}" actualizado.`);
        } else {
          await ingredientsRepository.create(input);
          setMessage(`Ingrediente "${input.name}" agregado al catálogo.`);
        }
        await reload();
      } catch (err) {
        setError(errorMessage(err, "No se pudo guardar el ingrediente."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);
      try {
        const target = ingredients.find((ingredient) => ingredient.id === id);
        await ingredientsRepository.remove(id);
        setMessage(
          target
            ? `Ingrediente "${target.name}" eliminado del catálogo.`
            : "Ingrediente eliminado del catálogo.",
        );
        await reload();
      } catch (err) {
        setError(errorMessage(err, "No se pudo eliminar el ingrediente."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [ingredients, reload],
  );

  const clearMessage = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  const updateFilters = useCallback((partial: Partial<IngredientFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        ingredients
          .map((ingredient) => (ingredient.category || "").trim())
          .filter((category) => category !== "" && category !== "TODAS"),
      ),
    ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    return ["TODAS", ...unique];
  }, [ingredients]);

  const filteredIngredients = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return ingredients.filter((ingredient) => {
      const name = (ingredient.name || "").toLowerCase();
      const category = (ingredient.category || "").toLowerCase();
      const matchesSearch =
        search === "" || name.includes(search) || category.includes(search);

      if (!matchesSearch) return false;
      if (filters.category === "TODAS") return true;
      return ingredient.category === filters.category;
    });
  }, [ingredients, filters]);

  return {
    ingredients,
    suppliers,
    categories,
    filteredIngredients,
    filters,
    updateFilters,
    loading,
    saving,
    error,
    message,
    clearMessage,
    reload,
    save,
    remove,
  };
}
