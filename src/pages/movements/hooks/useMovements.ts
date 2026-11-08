import { useCallback, useEffect, useMemo, useState } from "react";
import { movementsRepository } from "../../../services/movements";
import type { StockMovement } from "../../../services/movements";
import { batchesRepository } from "../../../services/batches";
import type { Batch } from "../../../services/batches";
import { itemsRepository } from "../../../services/items";
import type { Item } from "../../../services/items";

export interface MovementRow extends StockMovement {
  batchNumber: string | null;
  itemId: string | null;
  itemName: string | null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Hook que encapsula el acceso a datos de la sección de movimientos.
 * Los movimientos son de solo lectura; se enriquecen con el lote e insumo
 * asociados cuando siguen existiendo en el catálogo.
 */
export function useMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [movementList, batchList, itemList] = await Promise.all([
        movementsRepository.list(),
        batchesRepository.list(),
        itemsRepository.list(),
      ]);
      setMovements(movementList);
      setBatches(batchList);
      setItems(itemList);
    } catch (err) {
      setError(
        errorMessage(err, "No se pudieron cargar los movimientos de almacén."),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!movementsRepository.subscribe) return;
    return movementsRepository.subscribe(() => {
      void reload();
    });
  }, [reload]);

  const rows = useMemo<MovementRow[]>(() => {
    const batchById = new Map(batches.map((batch) => [batch.id, batch]));
    const itemById = new Map(items.map((item) => [item.id, item]));

    return movements.map((movement) => {
      const batch = batchById.get(movement.batchId) ?? null;
      const item = batch ? itemById.get(batch.itemId) ?? null : null;

      return {
        ...movement,
        batchNumber: batch?.batchNumber ?? null,
        itemId: batch?.itemId ?? null,
        itemName: item?.name ?? null,
      };
    });
  }, [movements, batches, items]);

  return {
    movements,
    rows,
    loading,
    error,
    reload,
  };
}
