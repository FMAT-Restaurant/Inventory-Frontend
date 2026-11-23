import { useCallback, useEffect, useMemo, useState } from "react";
import { movementsRepository } from "../../../services/movements";
import type { StockMovement } from "../../../services/movements";
import { batchesRepository } from "../../../services/batches";
import type { Batch } from "../../../services/batches";
import { itemsRepository } from "../../../services/items";
import type { Item } from "../../../services/items";
import { fetchAllPages } from "../../../services/pagination";

export interface MovementRow extends StockMovement {
  batchNumber: string | null;
  itemId: string | null;
  itemName: string | null;
}

/** Tamaño de página por defecto del kardex. */
export const DEFAULT_MOVEMENTS_LIMIT = 25;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Hook que encapsula el acceso a datos de la sección de movimientos.
 *
 * - Los movimientos se pagina en el servidor (`page`/`limit`).
 * - Los lotes e insumos se cargan UNA sola vez como catálogo de lookup para
 *   enriquecer cada movimiento con su lote/insumo. Se usa `fetchAllPages`
 *   porque el backend limita `limit <= 100` y aquí necesitamos el catálogo
 *   completo. Las mutaciones (merma/compra) refrescan ambos vía `reload()`.
 */
export function useMovements() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState<number>(DEFAULT_MOVEMENTS_LIMIT);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Bump para volver a cargar los catálogos (lotes + insumos).
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Página de movimientos: depende de page/limit.
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const movementPage = await movementsRepository.list({ page, limit });
      setMovements(movementPage.items);
      setTotal(movementPage.total);
      setTotalPages(movementPage.totalPages);
    } catch (err) {
      setError(
        errorMessage(err, "No se pudieron cargar los movimientos de almacén."),
      );
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  // Catálogo de lookup: se carga al montar y cuando se invalida.
  const reloadCatalog = useCallback(async () => {
    try {
      const [batchList, itemList] = await Promise.all([
        fetchAllPages((p, l) => batchesRepository.list({ page: p, limit: l })),
        fetchAllPages((p, l) => itemsRepository.list({ page: p, limit: l })),
      ]);
      setBatches(batchList);
      setItems(itemList);
    } catch (err) {
      // Un fallo del catálogo no debe romper el kardex: deja los maps vacíos
      // y se muestran "Insumo no disponible".
      console.error("No se pudieron cargar los catálogos:", err);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    void reloadCatalog();
  }, [reloadCatalog, catalogVersion]);

  // Suscripción reactiva (mock): refresca movimientos y catálogo.
  useEffect(() => {
    if (!movementsRepository.subscribe) return;
    return movementsRepository.subscribe(() => {
      void reload();
      setCatalogVersion((v) => v + 1);
    });
  }, [reload]);

  /** Recarga completa: movimientos + catálogos (tras registrar una merma). */
  const reloadAll = useCallback(async () => {
    await Promise.all([reload(), reloadCatalog()]);
  }, [reload, reloadCatalog]);

  const goToPage = useCallback((next: number) => {
    setPage(Math.max(1, Math.trunc(next) || 1));
  }, []);

  const changeLimit = useCallback((next: number) => {
    setLimit(Math.max(1, Math.trunc(next) || 1));
    setPage(1);
  }, []);

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
    reload: reloadAll,
    page,
    limit,
    total,
    totalPages,
    goToPage,
    changeLimit,
  };
}
