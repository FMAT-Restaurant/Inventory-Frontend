import { useCallback, useEffect, useMemo, useState } from "react";
import { itemsRepository } from "../../../services/items";
import { isActiveSupplier } from "../../../services/suppliers/labels";
import type { Item, Supplier } from "../../../services/items";
import { batchesRepository } from "../../../services/batches";
import type {
  Batch,
  CreateBatchInput,
  UpdateBatchInput,
} from "../../../services/batches";

export interface BatchFilters {
  search: string;
  status: string;
  category: string;
  batchCondition: string;
}

export const INITIAL_BATCH_FILTERS: BatchFilters = {
  search: "",
  status: "TODOS",
  category: "TODAS",
  batchCondition: "TODOS",
};

export function validateCreateBatchInput(
  input: CreateBatchInput,
  isPerishable = true,
): string | null {
  if (!input.itemId) {
    return "Selecciona el insumo a reabastecer.";
  }
  if (Number.isNaN(Number(input.quantity)) || Number(input.quantity) <= 0) {
    return "La cantidad comprada debe ser mayor a 0.";
  }
  if (Number.isNaN(Number(input.cost)) || Number(input.cost) <= 0) {
    return "El costo unitario debe ser mayor a 0.";
  }
  if (isPerishable && !input.expirationDate) {
    return "Selecciona la fecha de caducidad.";
  }
  return null;
}

export function validateUpdateBatchInput(
  input: UpdateBatchInput,
  previousQuantity?: number,
  entryDate?: string,
  isPerishable = true,
): string | null {
  if (
    input.quantity !== undefined &&
    (Number.isNaN(Number(input.quantity)) || Number(input.quantity) < 0)
  ) {
    return "La cantidad debe ser 0 o mayor.";
  }
  if (
    input.cost !== undefined &&
    (Number.isNaN(Number(input.cost)) || Number(input.cost) <= 0)
  ) {
    return "El costo unitario debe ser mayor a 0.";
  }
  if (isPerishable && input.expirationDate !== undefined && !input.expirationDate) {
    return "Selecciona la fecha de caducidad.";
  }
  if (
    entryDate &&
    input.expirationDate &&
    input.expirationDate < entryDate
  ) {
    return "La fecha de caducidad no puede ser anterior a la fecha de ingreso.";
  }
  if (
    previousQuantity !== undefined &&
    input.quantity !== undefined &&
    Number(input.quantity) !== Number(previousQuantity) &&
    (!input.reason || !input.reason.trim())
  ) {
    return "Indica el motivo del ajuste al modificar la cantidad del lote.";
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
  const [items, setItems] = useState<Item[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  // Todos los proveedores, incluidos los dados de baja.
  const [allSuppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<BatchFilters>(INITIAL_BATCH_FILTERS);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Toleramos que el usuario tenga BATCHES_READ sin SUPPLIERS_READ
      // para que un 403 en proveedores no bloquee toda la gestión de lotes.
      const [itemList, batchList, supplierList] = await Promise.all([
        itemsRepository.list(),
        batchesRepository.list(),
        itemsRepository.listSuppliers().catch(() => [] as Supplier[]),
      ]);
      setItems(itemList);
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
      const targetItem = items.find((i) => i.id === input.itemId);
      const isPerishable = targetItem ? Boolean(targetItem.isPerishable) : true;
      const validationError = validateCreateBatchInput(input, isPerishable);
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
    [items, reload],
  );

  const updateBatch = useCallback(
    async (
      id: string,
      input: UpdateBatchInput,
      previousQuantity?: number,
      entryDate?: string,
      isPerishable = true,
    ) => {
      const validationError = validateUpdateBatchInput(
        input,
        previousQuantity,
        entryDate,
        isPerishable,
      );
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

  const writeOffExpiredBatch = useCallback(
    async (id: string, reason = "Baja por caducidad de lote") => {
      setSaving(true);
      setError(null);
      try {
        const updated = await batchesRepository.update(id, {
          quantity: 0,
          reason,
        });
        setMessage(
          `Baja por caducidad registrada: el lote "${updated.batchNumber}" quedó con saldo 0.`,
        );
        await reload();
        return updated;
      } catch (err) {
        setError(
          errorMessage(err, "No se pudo dar de baja el lote caducado."),
        );
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

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_BATCH_FILTERS);
  }, []);

  const hasActiveFilters = useMemo(
    () =>
      filters.search.trim() !== "" ||
      filters.status !== "TODOS" ||
      filters.category !== "TODAS" ||
      filters.batchCondition !== "TODOS",
    [filters],
  );

  const batchesByItemId = useMemo(() => {
    const map = new Map<string, Batch[]>();
    for (const batch of batches) {
      const current = map.get(batch.itemId) ?? [];
      current.push(batch);
      map.set(batch.itemId, current);
    }
    for (const [itemId, list] of map.entries()) {
      list.sort((a, b) => {
        const aTime = a.expirationDate
          ? new Date(a.expirationDate).getTime()
          : Number.POSITIVE_INFINITY;
        const bTime = b.expirationDate
          ? new Date(b.expirationDate).getTime()
          : Number.POSITIVE_INFINITY;
        if (aTime !== bTime) return aTime - bTime;
        return (a.entryDate || "").localeCompare(b.entryDate || "");
      });
      map.set(itemId, list);
    }
    return map;
  }, [batches]);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const item of items) {
      const cat = (item.category || "").trim();
      if (cat) unique.add(cat);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "es"));
  }, [items]);

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      const itemBatches = batchesByItemId.get(item.id) ?? [];

      const name = (item.name || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const sku = (item.sku || "").toLowerCase();
      const matchesBatchCode = itemBatches.some((b) =>
        (b.batchNumber || "").toLowerCase().includes(search),
      );
      const matchesSearch =
        search === "" ||
        name.includes(search) ||
        category.includes(search) ||
        sku.includes(search) ||
        matchesBatchCode;

      if (!matchesSearch) return false;

      if (
        filters.category !== "TODAS" &&
        (item.category || "").trim() !== filters.category
      ) {
        return false;
      }

      if (filters.status !== "TODOS" && item.status !== filters.status) {
        return false;
      }

      if (filters.batchCondition === "CON_CADUCADOS") {
        return itemBatches.some(
          (b) => b.status === "expired" && Number(b.quantity) > 0,
        );
      }
      if (filters.batchCondition === "VENCE_HOY") {
        return itemBatches.some(
          (b) => b.status === "expires_today" && Number(b.quantity) > 0,
        );
      }
      if (filters.batchCondition === "SOLO_ACTIVOS") {
        return itemBatches.some(
          (b) => b.status === "active" && Number(b.quantity) > 0,
        );
      }
      if (filters.batchCondition === "SIN_LOTES") {
        return itemBatches.length === 0;
      }

      return true;
    });
  }, [items, filters, batchesByItemId]);

  // Solo los activos pueden asignarse a un lote o insumo nuevo.
  const suppliers = useMemo(
    () => allSuppliers.filter(isActiveSupplier),
    [allSuppliers],
  );

  return {
    items,
    batches,
    batchesByItemId,
    suppliers,
    allSuppliers,
    categories,
    filteredItems,
    filters,
    hasActiveFilters,
    updateFilters,
    resetFilters,
    loading,
    saving,
    error,
    message,
    clearMessage,
    reload,
    createBatch,
    updateBatch,
    writeOffExpiredBatch,
    removeBatch,
  };
}
