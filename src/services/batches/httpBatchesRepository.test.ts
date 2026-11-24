import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { httpBatchesRepository } from "./httpBatchesRepository";

const RAW_BATCH = {
  _id: "660000000000000000000001",
  batchNumber: "ITM-01-LOT-20261123-AA11",
  itemId: "660000000000000000000010",
  supplierId: "660000000000000000000020",
  initialQuantity: 20,
  quantity: 12,
  cost: 45.5,
  expirationDate: "2026-12-31T00:00:00.000Z",
  createdAt: "2026-11-23T12:00:00.000Z",
  status: "active" as const,
  __v: 0,
};

function mockResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("httpBatchesRepository", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("lista lotes y normaliza _id, expirationDate y entryDate local", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        items: [RAW_BATCH],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    );

    const result = await httpBatchesRepository.list();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/batches/);
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({
      id: RAW_BATCH._id,
      batchNumber: RAW_BATCH.batchNumber,
      itemId: RAW_BATCH.itemId,
      supplierId: RAW_BATCH.supplierId,
      initialQuantity: 20,
      quantity: 12,
      cost: 45.5,
      expirationDate: "2026-12-31",
      status: "active",
    });
    expect(result.items[0].entryDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("filtra por itemId en query string cuando se proporciona", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({
        items: [RAW_BATCH],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      }),
    );

    await httpBatchesRepository.list({ itemId: "660000000000000000000010" });

    const [url] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/batches\?.*itemId=660000000000000000000010/);
  });

  it("crea un lote enviando POST /batches con campos normalizados", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(RAW_BATCH, { status: 201 }));

    const created = await httpBatchesRepository.create({
      batchNumber: "  LOT-01  ",
      itemId: RAW_BATCH.itemId,
      supplierId: RAW_BATCH.supplierId,
      quantity: 20,
      cost: 45.5,
      expirationDate: "2026-12-31",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/batches$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({
      batchNumber: "LOT-01",
      itemId: RAW_BATCH.itemId,
      supplierId: RAW_BATCH.supplierId,
      quantity: 20,
      cost: 45.5,
      expirationDate: "2026-12-31",
    });
    expect(created.id).toBe(RAW_BATCH._id);
  });

  it("envía PATCH /batches/:id incluyendo reason recortado para auditoría", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse({ ...RAW_BATCH, quantity: 8 }),
    );

    const updated = await httpBatchesRepository.update(RAW_BATCH._id, {
      batchNumber: "  LOT-CORREGIDO  ",
      supplierId: null,
      quantity: 8,
      cost: 45.5,
      expirationDate: "2026-12-31",
      reason: "  Corrección por conteo físico  ",
    });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`/batches/${RAW_BATCH._id}$`));
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({
      batchNumber: "LOT-CORREGIDO",
      supplierId: null,
      quantity: 8,
      cost: 45.5,
      expirationDate: "2026-12-31",
      reason: "Corrección por conteo físico",
    });
    expect(updated.quantity).toBe(8);
  });

  it("elimina un lote mediante DELETE /batches/:id", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse("", { status: 200 }));

    await httpBatchesRepository.remove(RAW_BATCH._id);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(new RegExp(`/batches/${RAW_BATCH._id}$`));
    expect(options.method).toBe("DELETE");
  });
});
