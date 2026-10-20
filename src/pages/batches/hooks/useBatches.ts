import { useCallback, useEffect, useMemo, useState } from "react";
import { ingredientsRepository } from "../../../services/ingredients";
import type { Ingredient, Supplier } from "../../../services/ingredients";
import { batchesRepository } from "../../../services/batches";
import type {
  Batch,
  CreateBatchInput,
  UpdateBatchInput,
} from "../../../services/batches";

export interface BatchFilters {
  search: string;
  status: string;
}

const INITIAL_FILTERS: BatchFilters = {
  search: "",
  status: "TODOS",
};

export function validateCreateBatchInput(
  input: CreateBatchInput,
): string | null {
  if (!input.ingredientId) {
    return "Selecciona el insumo a reabastecer.";
  }
  if (Number.isNaN(Number(input.quantity)) || Number(input.quantity) <= 0) {
    return "La cantidad comprada debe ser mayor a 0.";
  }
  if (Number.isNaN(Number(input.cost)) || Number(input.cost) < 0) {
    return "El costo unitario debe ser 0 o mayor.";
  }
  if (!input.expirationDate) {
    return "Selecciona la fecha de caducidad.";
  }
  return null;
}

export function validateUpdateBatchInput(
  input: UpdateBatchInput,
): string | null {
  if (
    input.quantity !== undefined &&
    (Number.isNaN(Number(input.quantity)) || Number(input.quantity) < 0)
  ) {
    return "La cantidad debe ser 0 o mayor.";
  }
  if (
    input.cost !== undefined &&
    (Number.isNaN(Number(input.cost)) || Number(input.cost) < 0)
  ) {
    return "El costo unitario debe ser 0 o mayor.";
  }
  if (input.expirationDate !== undefined && !input.expirationDate) {
    return "Selecciona la fecha de caducidad.";
  }
  return null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Hook que encapsula toda la lógica de negocio y el acceso a datos
 * de la sección de insumos y lotes (batches).
 */
export function useBatches() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<BatchFilters>(INITIAL_FILTERS);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ingredientList, batchList, supplierList] = await Promise.all([
        ingredientsRepository.list(),
        batchesRepository.list(),
        ingredientsRepository.listSuppliers(),
      ]);
      setIngredients(ingredientList);
      setBatches(batchList);
      setSuppliers(supplierList);
    } catch (err) {
      setError(
        errorMessage(err, "No se pudieron cargar los insumos y sus lotes."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!batchesRepository.subscribe) return;
    return batchesRepository.subscribe(() => {
      void reload();
    });
  }, [reload]);

  const createBatch = useCallback(
    async (input: CreateBatchInput) => {
      const validationError = validateCreateBatchInput(input);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setSaving(true);
      setError(null);
      try {
        const created = await batchesRepository.create(input);
        setMessage(
          `Compra registrada con éxito. Lote "${created.batchNumber}" generado.`,
        );
        await reload();
        return created;
      } catch (err) {
        setError(errorMessage(err, "No se pudo registrar el lote."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const updateBatch = useCallback(
    async (id: string, input: UpdateBatchInput) => {
      const validationError = validateUpdateBatchInput(input);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setSaving(true);
      setError(null);
      try {
        const updated = await batchesRepository.update(id, input);
        setMessage(`Lote "${updated.batchNumber}" actualizado.`);
        await reload();
        return updated;
      } catch (err) {
        setError(errorMessage(err, "No se pudo actualizar el lote."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const removeBatch = useCallback(
    async (id: string) => {
      setSaving(true);
      setError(null);
      try {
        const target = batches.find((b) => b.id === id);
        await batchesRepository.remove(id);
        setMessage(
          target
            ? `Lote "${target.batchNumber}" eliminado.`
            : "Lote eliminado.",
        );
        await reload();
      } catch (err) {
        setError(errorMessage(err, "No se pudo eliminar el lote."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [batches, reload],
  );

  const clearMessage = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  const updateFilters = useCallback((partial: Partial<BatchFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const filteredIngredients = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return ingredients.filter((ing) => {
      const name = (ing.name || "").toLowerCase();
      const category = (ing.category || "").toLowerCase();
      const matchesSearch =
        search === "" || name.includes(search) || category.includes(search);

      if (!matchesSearch) return false;
      if (filters.status === "TODOS") return true;
      return ing.status === filters.status;
    });
  }, [ingredients, filters]);

  const batchesByIngredientId = useMemo(() => {
    const map = new Map<string, Batch[]>();
    for (const batch of batches) {
      const current = map.get(batch.ingredientId) ?? [];
      current.push(batch);
      map.set(batch.ingredientId, current);
    }
    for (const [ingId, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(a.expirationDate).getTime() -
          new Date(b.expirationDate).getTime(),
      );
      map.set(ingId, list);
    }
    return map;
  }, [batches]);

  return {
    ingredients,
    batches,
    batchesByIngredientId,
    suppliers,
    filteredIngredients,
    filters,
    updateFilters,
    loading,
    saving,
    error,
    message,
    clearMessage,
    reload,
    createBatch,
    updateBatch,
    removeBatch,
  };
}
