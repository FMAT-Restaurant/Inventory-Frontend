import { useCallback, useEffect, useMemo, useState } from "react";
import { itemsRepository } from "../../../services/items";
import type { Item, ItemInput, Supplier } from "../../../services/items";

export interface ItemFilters {
  search: string;
  category: string;
}

const INITIAL_FILTERS: ItemFilters = {
  search: "",
  category: "TODAS",
};

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
 */
export function useItems() {
  const [items, setItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<ItemFilters>(INITIAL_FILTERS);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, supplierList] = await Promise.all([
        itemsRepository.list(),
        itemsRepository.listSuppliers(),
      ]);
      setItems(items);
      console.log("Insumos cargados:", items);
      console.log("Proveedores cargados:", supplierList);
      setSuppliers(supplierList);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar los insumos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

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

  const updateFilters = useCallback((partial: Partial<ItemFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

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

  const filteredItems = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    return items.filter((item) => {
      const name = (item.name || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const sku = (item.sku || "").toLowerCase();
      const description = (item.description || "").toLowerCase();
      const matchesSearch =
        search === "" ||
        name.includes(search) ||
        category.includes(search) ||
        sku.includes(search) ||
        description.includes(search);

      if (!matchesSearch) return false;
      if (filters.category === "TODAS") return true;
      return item.category === filters.category;
    });
  }, [items, filters]);

  return {
    items,
    suppliers,
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
  };
}
