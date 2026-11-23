import { useCallback, useEffect, useMemo, useState } from "react";
import { itemsRepository } from "../../../services/items";
import { fetchAllPages } from "../../../services/pagination";
import { isActiveSupplier } from "../../../services/suppliers/labels";
import type { Item, Supplier } from "../../../services/items";
import { batchesRepository } from "../../../services/batches";
import type { Batch, CreateBatchInput, UpdateBatchInput } from "../../../services/batches";

export interface BatchFilters {
  search: string;
  status: string;
}

const INITIAL_FILTERS: BatchFilters = {
  search: "",
  status: "TODOS",
};

/** Tamaño de página por defecto para el listado de insumos con lotes. */
export const DEFAULT_BATCHES_ITEMS_LIMIT = 20;

export function validateCreateBatchInput(
  input: CreateBatchInput,
): string | null {
  if (!input.itemId) {
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
 *
 * Paginación server-side sobre el listado de insumos. Los lotes se cargan
 * en un fetch ampliado para poder agruparlos por insumo en la vista.
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
  const [filters, setFilters] = useState<BatchFilters>(INITIAL_FILTERS);

  // Estado de paginación (sobre items)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_BATCHES_ITEMS_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Página de insumos (depende de búsqueda + page/limit).
  const reloadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const search = filters.search.trim();
      const itemPage = await itemsRepository.list({
        q: search || undefined,
        page,
        limit,
      });
      setItems(itemPage.items);
      setTotal(itemPage.total);
      setTotalPages(itemPage.totalPages);
    } catch (err) {
      setError(
        errorMessage(err, "No se pudieron cargar los insumos y sus lotes."),
      );
    } finally {
      setLoading(false);
    }
  }, [filters.search, page, limit]);

  // Catálogo de lotes + proveedores: se carga al montar y cuando se invalida.
  const reloadCatalog = useCallback(async () => {
    try {
      const [batchList, supplierList] = await Promise.all([
        fetchAllPages((p, l) => batchesRepository.list({ page: p, limit: l })),
        fetchAllPages((p, l) =>
          itemsRepository.listSuppliers({ page: p, limit: l }),
        ),
      ]);
      setBatches(batchList);
      setSuppliers(supplierList);
    } catch (err) {
      setError(
        errorMessage(err, "No se pudieron cargar los insumos y sus lotes."),
      );
    }
  }, []);

  // Recarga completa (tras crear/editar/eliminar un lote).
  const reload = useCallback(async () => {
    await Promise.all([reloadItems(), reloadCatalog()]);
  }, [reloadItems, reloadCatalog]);

  useEffect(() => {
    void reloadItems();
  }, [reloadItems]);

  useEffect(() => {
    void reloadCatalog();
  }, [reloadCatalog]);

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
    setFilters((prev) => {
      const next = { ...prev, ...partial };
      if (partial.search !== undefined && partial.search !== prev.search) {
        setPage(1);
      }
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

  /** El filtro por status se mantiene en memoria sobre la página actual. */
  const filteredItems = useMemo(() => {
    if (filters.status === "TODOS") return items;
    return items.filter((item) => item.status === filters.status);
  }, [items, filters.status]);

  const batchesByItemId = useMemo(() => {
    const map = new Map<string, Batch[]>();
    for (const batch of batches) {
      const current = map.get(batch.itemId) ?? [];
      current.push(batch);
      map.set(batch.itemId, current);
    }
    for (const [itemId, list] of map.entries()) {
      list.sort(
        (a, b) =>
          new Date(a.expirationDate).getTime() -
          new Date(b.expirationDate).getTime(),
      );
      map.set(itemId, list);
    }
    return map;
  }, [batches]);

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
    filteredItems,
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
    // Paginación
    page,
    limit,
    total,
    totalPages,
    goToPage,
    changeLimit,
  };
}
