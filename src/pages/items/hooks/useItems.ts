import { useCallback, useEffect, useMemo, useState } from "react";
import { itemsRepository } from "../../../services/items";
import { fetchAllPages } from "../../../services/pagination";
import { usePagination } from "../../../hooks/usePagination";
import { isActiveSupplier } from "../../../services/suppliers/labels";
import type { Item, ItemInput, Supplier } from "../../../services/items";

export interface ItemFilters {
  search: string;
  category: string;
}

const INITIAL_FILTERS: ItemFilters = {
  search: "",
  category: "TODAS",
};

/** Tamaño de página por defecto para el listado de insumos. */
export const DEFAULT_ITEMS_LIMIT = 24;

export function validateItemInput(input: ItemInput): string | null {
  if (!input.sku || !input.sku.trim()) {
    return "El SKU del insumo es obligatorio.";
  }
  if (!input.name || !input.name.trim()) {
    return "El nombre del insumo es obligatorio.";
  }
  if (!input.unit || !input.unit.trim()) {
    return "Selecciona una unidad de medida.";
  }
  if (!input.storageCondition || !input.storageCondition.trim()) {
    return "Selecciona la condición de almacenamiento.";
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
 * de la sección de insumos. La vista solo consume su resultado.
 *
 * Paginación server-side: `q` y `page`/`limit` viajan al backend.
 * El filtro por categoría se aplica en memoria sobre la página actual
 * (el backend solo expone búsqueda textual `q`).
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  // Todos los proveedores, incluidos los dados de baja (cache para lookup).
  const [allSuppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<ItemFilters>(INITIAL_FILTERS);

  // Estado de paginación compartido (usePagination).
  const {
    pagination,
    page,
    limit,
    applyPage,
    goToPage,
    changeLimit,
    resetPage,
  } = usePagination(DEFAULT_ITEMS_LIMIT);

  // Página de insumos (depende de búsqueda + page/limit).
  const reloadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const search = filters.search.trim();
      const pageData = await itemsRepository.list({
        q: search || undefined,
        page,
        limit,
      });
      setItems(pageData.items);
      applyPage(pageData);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar los insumos."));
    } finally {
      setLoading(false);
    }
  }, [filters.search, page, limit, applyPage]);

  // Catálogo de proveedores: se carga al montar y cuando se invalida.
  // `fetchAllPages` respeta el límite de 100 del backend trayendo todas
  // las páginas necesarias.
  const reloadSuppliers = useCallback(async () => {
    try {
      const supplierList = await fetchAllPages((p, l) =>
        itemsRepository.listSuppliers({ page: p, limit: l }),
      );
      setSuppliers(supplierList);
    } catch (err) {
      // Un fallo del catálogo no rompe la lista de insumos.
      console.error("No se pudieron cargar los proveedores:", err);
    }
  }, []);

  // Recarga completa (tras guardar/eliminar).
  const reload = useCallback(async () => {
    await Promise.all([reloadItems(), reloadSuppliers()]);
  }, [reloadItems, reloadSuppliers]);

  useEffect(() => {
    void reloadItems();
  }, [reloadItems]);

  useEffect(() => {
    void reloadSuppliers();
  }, [reloadSuppliers]);

  useEffect(() => {
    if (!itemsRepository.subscribe) return;
    return itemsRepository.subscribe(() => {
      void reload();
    });
  }, [reload]);

  const save = useCallback(
    async (input: ItemInput) => {
      const validationError = validateItemInput(input);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setSaving(true);
      setError(null);
      try {
        if (input.id) {
          await itemsRepository.update(input.id, input);
          setMessage(`Insumo "${input.name}" actualizado.`);
        } else {
          await itemsRepository.create(input);
          setMessage(`Insumo "${input.name}" agregado al catálogo.`);
        }
        await reload();
      } catch (err) {
        setError(errorMessage(err, "No se pudo guardar el insumo."));
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
        const target = items.find((item) => item.id === id);
        await itemsRepository.remove(id);
        setMessage(
          target
            ? `Insumo "${target.name}" eliminado del catálogo.`
            : "Insumo eliminado del catálogo.",
        );
        await reload();
      } catch (err) {
        setError(errorMessage(err, "No se pudo eliminar el insumo."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [items, reload],
  );

  const clearMessage = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  /**
   * Actualiza filtros de búsqueda/categoría. Cambiar la búsqueda resetea
   * la página a 1 para no quedarse fuera de rango.
   */
  const updateFilters = useCallback(
    (partial: Partial<ItemFilters>) => {
      setFilters((prev) => {
        const searchChanged =
          partial.search !== undefined && partial.search !== prev.search;
        if (searchChanged) resetPage();
        return { ...prev, ...partial };
      });
    },
    [resetPage],
  );

  /**
   * El backend solo expone búsqueda textual `q`. El filtro por categoría
   * se aplica sobre la página actual.
   */
  const filteredItems = useMemo(() => {
    if (filters.category === "TODAS") return items;
    return items.filter((item) => item.category === filters.category);
  }, [items, filters.category]);

  /**
   * Categorías visibles: se derivan de los proveedores cargados y de los
   * insumos de la página actual. Cuando el backend exponga un endpoint de
   * categorías se puede reemplazar por esa fuente.
   */
  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        items
          .map((item) => (item.category || "").trim())
          .filter((category) => category !== "" && category !== "TODAS"),
      ),
    ).sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

    return ["TODAS", ...unique];
  }, [items]);

  // Solo los activos pueden asignarse a un lote o insumo nuevo.
  const suppliers = useMemo(
    () => allSuppliers.filter(isActiveSupplier),
    [allSuppliers],
  );

  return {
    items,
    suppliers,
    allSuppliers,
    categories,
    filteredItems,
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
    // Paginación: propagar con {...pagination} a <PaginationBar />
    pagination,
  };
}
