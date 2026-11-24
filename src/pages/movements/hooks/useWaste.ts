import { useCallback, useEffect, useMemo, useState } from "react";
import { wasteRepository } from "../../../services/waste";
import type { WasteInput } from "../../../services/waste";
import { batchesRepository } from "../../../services/batches";
import type { Batch } from "../../../services/batches";
import { itemsRepository } from "../../../services/items";
import type { Item } from "../../../services/items";
import { fetchAllPages } from "../../../services/pagination";

export interface WasteBatchOption {
  batchId: string;
  batchNumber: string;
  itemName: string;
  unit: string;
  quantity: number;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function validateWasteInput(
  input: WasteInput,
  available?: number,
): string | null {
  if (!input.batchId) return "Selecciona el lote donde se generó la merma.";
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "La cantidad debe ser mayor a 0.";
  }
  if (available !== undefined && quantity > available) {
    return `La cantidad excede lo que queda en el lote (${available}).`;
  }
  if (!input.reason?.trim()) {
    return "Indica el motivo de la merma.";
  }
  return null;
}

/**
 * Lógica del registro de mermas: carga los lotes con existencias y envía la
 * merma, que descuenta la cantidad del lote.
 */
export function useWaste(enabled: boolean) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [batchList, itemList] = await Promise.all([
        fetchAllPages((p, l) => batchesRepository.list({ page: p, limit: l })),
        fetchAllPages((p, l) => itemsRepository.list({ page: p, limit: l })),
      ]);
      setBatches(batchList);
      setItems(itemList);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar los lotes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void loadBatches();
  }, [enabled, loadBatches]);

  const batchOptions = useMemo<WasteBatchOption[]>(() => {
    const itemById = new Map(items.map((item) => [item.id, item]));
    return batches
      .filter((batch) => batch.quantity > 0)
      .map((batch) => {
        const item = itemById.get(batch.itemId);
        return {
          batchId: batch.id,
          batchNumber: batch.batchNumber,
          itemName: item?.name ?? "Insumo no disponible",
          unit: item?.unit ?? "",
          quantity: batch.quantity,
        };
      })
      .sort(
        (a, b) =>
          a.itemName.localeCompare(b.itemName) ||
          a.batchNumber.localeCompare(b.batchNumber),
      );
  }, [batches, items]);

  const register = useCallback(
    async (input: WasteInput) => {
      const available = batchOptions.find(
        (option) => option.batchId === input.batchId,
      )?.quantity;
      const validationError = validateWasteInput(input, available);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setSaving(true);
      setError(null);
      try {
        await wasteRepository.register(input);
      } catch (err) {
        setError(errorMessage(err, "No se pudo registrar la merma."));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [batchOptions],
  );

  const clearError = useCallback(() => setError(null), []);

  return { batchOptions, loading, saving, error, clearError, register };
}
