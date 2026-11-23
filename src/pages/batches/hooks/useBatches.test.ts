import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  useBatches,
  validateCreateBatchInput,
  validateUpdateBatchInput,
} from "./useBatches";
import { itemsRepository } from "../../../services/items";
import { batchesRepository } from "../../../services/batches";
import type { Item, Supplier } from "../../../services/items";
import type { Batch } from "../../../services/batches";

vi.mock("../../../services/items", async () => {
  const actual = await vi.importActual<typeof import("../../../services/items")>(
    "../../../services/items",
  );
  return {
    ...actual,
    itemsRepository: {
      list: vi.fn(),
      listSuppliers: vi.fn(),
    },
  };
});

vi.mock("../../../services/batches", async () => {
  const actual = await vi.importActual<
    typeof import("../../../services/batches")
  >("../../../services/batches");
  return {
    ...actual,
    batchesRepository: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
});

const itemsRepo = itemsRepository as unknown as {
  list: ReturnType<typeof vi.fn>;
  listSuppliers: ReturnType<typeof vi.fn>;
};

const batchesRepo = batchesRepository as unknown as {
  list: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

const ITEMS: Item[] = [
  {
    id: "item-1",
    sku: "VER-01",
    name: "Tomate",
    category: "Verduras",
    unit: "kg",
    minStock: 5,
    availableStock: 12,
    reservedStock: 0,
    totalStock: 12,
    status: "OPTIMO",
    isPerishable: true,
    storageCondition: "Refrigerado",
    averageCost: 20,
    supplierIdSugested: null,
  },
  {
    id: "item-2",
    sku: "LAC-01",
    name: "Leche Entera",
    category: "Lácteos",
    unit: "L",
    minStock: 10,
    availableStock: 4,
    reservedStock: 0,
    totalStock: 4,
    status: "BAJO",
    isPerishable: true,
    storageCondition: "Refrigerado",
    averageCost: 25,
    supplierIdSugested: null,
  },
];

const BATCHES: Batch[] = [
  {
    id: "b-late",
    batchNumber: "VER-01-L2",
    itemId: "item-1",
    supplierId: "sup-1",
    initialQuantity: 10,
    quantity: 10,
    cost: 20,
    expirationDate: "2099-06-01",
    entryDate: "2026-11-23",
    status: "active",
  },
  {
    id: "b-early",
    batchNumber: "VER-01-L1",
    itemId: "item-1",
    supplierId: "sup-1",
    initialQuantity: 2,
    quantity: 2,
    cost: 18,
    expirationDate: "2099-01-15",
    entryDate: "2026-11-23",
    status: "active",
  },
  {
    id: "b-expired",
    batchNumber: "LAC-01-EXP",
    itemId: "item-2",
    supplierId: "sup-1",
    initialQuantity: 5,
    quantity: 5,
    cost: 25,
    expirationDate: "2020-01-01",
    entryDate: "2026-11-23",
    status: "expired",
  },
];

const SUPPLIERS: Supplier[] = [
  { id: "sup-1", name: "Distribuidora Central", isActive: true },
];

describe("validaciones de lotes", () => {
  it("rechaza costo <= 0 y cantidad <= 0 al crear", () => {
    expect(
      validateCreateBatchInput({
        itemId: "item-1",
        quantity: 5,
        cost: 0,
        expirationDate: "2099-12-31",
      }),
    ).toMatch(/costo/i);

    expect(
      validateCreateBatchInput({
        itemId: "item-1",
        quantity: 0,
        cost: 10,
        expirationDate: "2099-12-31",
      }),
    ).toMatch(/cantidad/i);
  });

  it("exige motivo (reason) cuando cambia la cantidad en una actualización", () => {
    expect(
      validateUpdateBatchInput({ quantity: 8, cost: 20 }, 10),
    ).toMatch(/motivo/i);

    expect(
      validateUpdateBatchInput(
        { quantity: 8, cost: 20, reason: "Conteo físico" },
        10,
      ),
    ).toBeNull();
  });
});

describe("useBatches", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    itemsRepo.list.mockResolvedValue(ITEMS);
    itemsRepo.listSuppliers.mockResolvedValue(SUPPLIERS);
    batchesRepo.list.mockResolvedValue(BATCHES);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("ordena los lotes de cada insumo en orden FEFO (vencimiento más próximo primero)", async () => {
    const { result } = renderHook(() => useBatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    const item1Batches = result.current.batchesByItemId.get("item-1") ?? [];
    expect(item1Batches.map((b) => b.id)).toEqual(["b-early", "b-late"]);
  });

  it("tolera error 403 en listSuppliers sin romper la carga de lotes", async () => {
    itemsRepo.listSuppliers.mockRejectedValueOnce(new Error("Forbidden"));

    const { result } = renderHook(() => useBatches());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.items).toHaveLength(2);
    expect(result.current.batches).toHaveLength(3);
    expect(result.current.suppliers).toEqual([]);
  });

  it("filtra por categoría, estado de stock, estado de lotes (CON_CADUCADOS) y búsqueda por SKU/lote", async () => {
    const { result } = renderHook(() => useBatches());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.categories).toEqual(["Lácteos", "Verduras"]);

    act(() => {
      result.current.updateFilters({ category: "Verduras" });
    });
    expect(result.current.filteredItems.map((i) => i.id)).toEqual(["item-1"]);

    act(() => {
      result.current.resetFilters();
      result.current.updateFilters({ batchCondition: "CON_CADUCADOS" });
    });
    expect(result.current.filteredItems.map((i) => i.id)).toEqual(["item-2"]);

    act(() => {
      result.current.resetFilters();
      result.current.updateFilters({ search: "VER-01-L2" });
    });
    expect(result.current.filteredItems.map((i) => i.id)).toEqual(["item-1"]);
  });
});
