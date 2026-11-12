import { useCallback, useEffect, useMemo, useState } from "react";
import { wasteRepository } from "../../../services/waste";
import type {
  ConsumedBatch,
  ServedOrder,
  WasteInput,
} from "../../../services/waste";
import { batchesRepository } from "../../../services/batches";
import type { Batch } from "../../../services/batches";
import { itemsRepository } from "../../../services/items";
import type { Item } from "../../../services/items";

export interface ConsumedBatchOption extends ConsumedBatch {
  batchNumber: string;
  itemName: string;
  unit: string;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function validateWasteInput(
  input: WasteInput,
  remaining?: number,
): string | null {
  if (!input.orderId) return "Selecciona la orden servida.";
  if (!input.batchId) return "Selecciona el lote consumido.";
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return "La cantidad debe ser mayor a 0.";
  }
  if (remaining !== undefined && quantity > remaining) {
    return `La cantidad excede lo disponible para merma (${remaining}).`;
  }
  if (!input.reason || !input.reason.trim()) {
    return "Indica el motivo de la merma.";
  }
  return null;
}

/**
 * Lógica del registro de mermas: carga las órdenes servidas, los lotes que
 * consumió cada una y envía la merma. No modifica el stock.
 */
export function useWaste(enabled: boolean) {
  const [orders, setOrders] = useState<ServedOrder[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [consumed, setConsumed] = useState<ConsumedBatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderList, batchList, itemList] = await Promise.all([
        wasteRepository.listServedOrders(),
        batchesRepository.list(),
        itemsRepository.list(),
      ]);
      setOrders(orderList);
      setBatches(batchList);
      setItems(itemList);
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar las órdenes servidas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) void loadOrders();
  }, [enabled, loadOrders]);

  const loadConsumed = useCallback(async (orderId: string) => {
    setConsumed([]);
    if (!orderId) return;
    setError(null);
    try {
      setConsumed(await wasteRepository.listConsumedBatches(orderId));
    } catch (err) {
      setError(errorMessage(err, "No se pudieron cargar los lotes de la orden."));
    }
  }, []);

  const batchOptions = useMemo<ConsumedBatchOption[]>(() => {
    const batchById = new Map(batches.map((batch) => [batch.id, batch]));
    const itemById = new Map(items.map((item) => [item.id, item]));
    return consumed.map((entry) => {
      const batch = batchById.get(entry.batchId);
      const item = batch ? itemById.get(batch.itemId) : undefined;
      return {
        ...entry,
        batchNumber: batch?.batchNumber ?? entry.batchId,
        itemName: item?.name ?? "Insumo no disponible",
        unit: item?.unit ?? "",
      };
    });
  }, [consumed, batches, items]);

  const register = useCallback(
    async (input: WasteInput) => {
      const remaining = batchOptions.find(
        (option) => option.batchId === input.batchId,
      )?.remaining;
      const validationError = validateWasteInput(input, remaining);
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

  return {
    orders,
    batchOptions,
    loading,
    saving,
    error,
    clearError,
    loadOrders,
    loadConsumed,
    register,
  };
}
