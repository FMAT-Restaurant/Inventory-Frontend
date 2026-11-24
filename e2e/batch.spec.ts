import { test, expect, type APIRequestContext, type Page } from "@playwright/test";

const API_URL =
  process.env.E2E_API_URL ??
  process.env.VITE_API_URL ??
  "http://localhost:8083";

interface SeededItem {
  id: string;
  sku: string;
  name: string;
  category: string;
}

async function seedItem(
  request: APIRequestContext,
  suffix: string,
  category = "Verduras E2E",
): Promise<SeededItem> {
  const sku = `BCH-${suffix}`.toUpperCase();
  const name = `Insumo Lotes ${suffix}`;
  const res = await request.post(`${API_URL}/items`, {
    data: {
      sku,
      name,
      category,
      unit: "kg",
      minStock: 5,
      isPerishable: true,
      storageCondition: "Refrigerado",
    },
  });
  expect(res.ok(), `POST /items falló: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return {
    id: String(body._id ?? body.id),
    sku,
    name,
    category,
  };
}

async function cleanupItem(request: APIRequestContext, itemId: string) {
  await request.delete(`${API_URL}/items/${itemId}`).catch(() => {});
}

async function goToBatches(page: Page) {
  await page.goto("./");
  await expect(
    page.getByRole("heading", { name: "Inventario", level: 1 }),
  ).toBeVisible({ timeout: 30_000 });

  await page
    .getByRole("heading", { name: "Lotes", exact: true, level: 2 })
    .click();

  await expect(
    page.getByRole("heading", { name: "Gestión de Lotes", level: 1 }),
  ).toBeVisible();
}

function itemCardOf(page: Page, itemName: string) {
  return page.locator(".batch-item-card", {
    has: page.getByRole("heading", { name: itemName, level: 3 }),
  });
}

test.describe("BatchesPage — E2E flujo completo (Front + Back + MongoDB)", () => {
  test("crea dos lotes, respeta orden FEFO, persiste tras recarga y sincroniza stock en Backend", async ({
    page,
    request,
  }, testInfo) => {
    const suffix = `${Date.now().toString(36)}-${testInfo.project.name}-1`;
    const seeded = await seedItem(request, suffix);

    try {
      await goToBatches(page);

      // Buscar nuestro insumo recién creado
      await page
        .getByPlaceholder("Buscar por nombre, SKU, categoría o lote...")
        .fill(seeded.name);

      const card = itemCardOf(page, seeded.name);
      await expect(card).toBeVisible();

      // 1) Registrar primer lote con fecha lejana (2099-06-15)
      await card.getByRole("button", { name: "+ Comprar" }).click();
      let dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("Número de lote (opcional)").fill("LOTE-LEJANO");
      await dialog.getByLabel("Cantidad comprada").fill("10");
      await dialog.getByLabel("Costo unitario ($)").fill("20");
      await dialog.getByLabel("Fecha de caducidad").fill("2099-06-15");
      await dialog.getByRole("button", { name: "Guardar compra" }).click();
      await expect(dialog).toBeHidden();

      // 2) Registrar segundo lote con fecha más próxima (2099-02-01)
      await card.getByRole("button", { name: "+ Comprar" }).click();
      dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("Número de lote (opcional)").fill("LOTE-PROXIMO");
      await dialog.getByLabel("Cantidad comprada").fill("6");
      await dialog.getByLabel("Costo unitario ($)").fill("18");
      await dialog.getByLabel("Fecha de caducidad").fill("2099-02-01");
      await dialog.getByRole("button", { name: "Guardar compra" }).click();
      await expect(dialog).toBeHidden();

      // Verificar que ambos lotes aparecen y el más próximo tiene Prioridad de uso
      await expect(card.getByText(`${seeded.sku}-LOTE-PROXIMO`)).toBeVisible();
      await expect(card.getByText(`${seeded.sku}-LOTE-LEJANO`)).toBeVisible();
      await expect(card.getByText("Prioridad de uso")).toBeVisible();

      // Verificar persistencia real tras recarga completa
      await page.reload();
      await page
        .getByPlaceholder("Buscar por nombre, SKU, categoría o lote...")
        .fill(seeded.name);
      const reloadedCard = itemCardOf(page, seeded.name);
      await expect(reloadedCard).toBeVisible();
      await expect(reloadedCard.getByText("Lotes (2)")).toBeVisible();

      // Verificar sincronización real de totalStock en el Backend
      const itemRes = await request.get(`${API_URL}/items/${seeded.id}`);
      expect(itemRes.ok()).toBeTruthy();
      const itemBody = await itemRes.json();
      expect(itemBody.totalStock).toBe(16);
    } finally {
      await cleanupItem(request, seeded.id);
    }
  });

  test("muestra popover informativo de estados de stock y filtra por categoría y lotes caducados", async ({
    page,
    request,
  }, testInfo) => {
    const suffix = `${Date.now().toString(36)}-${testInfo.project.name}-2`;
    const uniqueCategory = `Cat-${suffix}`;
    const seeded = await seedItem(request, suffix, uniqueCategory);

    try {
      // Sembrar un lote caducado directamente en Backend
      const expRes = await request.post(`${API_URL}/batches`, {
        data: {
          batchNumber: "VENCIDO-01",
          itemId: seeded.id,
          quantity: 4,
          cost: 15,
          expirationDate: "2020-01-01",
        },
      });
      expect(expRes.ok()).toBeTruthy();

      await goToBatches(page);

      // Abrir botón informativo (i) y verificar leyenda clara
      const infoBtn = page.getByRole("button", {
        name: "Información sobre estados de stock",
      });
      await infoBtn.click();
      const guide = page.getByRole("dialog", {
        name: "Guía de estados de stock",
      });
      await expect(guide).toBeVisible();
      await expect(guide.getByText(/disponible > umbral mínimo/i)).toBeVisible();
      await expect(guide.getByText(/disponible = 0/i)).toBeVisible();

      // Cerrar con Escape
      await page.keyboard.press("Escape");
      await expect(guide).toBeHidden();

      // Filtrar por categoría y estado de lotes "Con lotes caducados"
      await page
        .getByLabel("Filtrar por categoría")
        .selectOption(uniqueCategory);
      await page
        .getByLabel("Filtrar por estado de lotes")
        .selectOption("CON_CADUCADOS");

      const card = itemCardOf(page, seeded.name);
      await expect(card).toBeVisible();
      await expect(card.getByText(/Caducado: 4 kg/i)).toBeVisible();

      // Limpiar filtros
      await page.getByRole("button", { name: "Limpiar filtros" }).click();
      await expect(
        page.getByLabel("Filtrar por categoría"),
      ).toHaveValue("TODAS");
    } finally {
      await cleanupItem(request, seeded.id);
    }
  });

  test("ajusta cantidad con motivo (reason) y persiste el movimiento de auditoría en Backend", async ({
    page,
    request,
  }, testInfo) => {
    const suffix = `${Date.now().toString(36)}-${testInfo.project.name}-3`;
    const seeded = await seedItem(request, suffix);

    try {
      const batchRes = await request.post(`${API_URL}/batches`, {
        data: {
          batchNumber: "AJUSTE-01",
          itemId: seeded.id,
          quantity: 10,
          cost: 25,
          expirationDate: "2099-12-31",
        },
      });
      expect(batchRes.ok()).toBeTruthy();
      const createdBatch = await batchRes.json();
      const batchId = String(createdBatch._id ?? createdBatch.id);

      await goToBatches(page);
      await page
        .getByPlaceholder("Buscar por nombre, SKU, categoría o lote...")
        .fill(seeded.name);

      const card = itemCardOf(page, seeded.name);
      await card.getByRole("button", { name: /Lotes \(1\)/ }).click();
      await card.getByRole("button", { name: "Editar" }).click();

      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await dialog.getByLabel("Cantidad actual").fill("7");

      // Al cambiar cantidad debe aparecer el campo Motivo del ajuste
      const reasonInput = dialog.getByLabel("Motivo del ajuste");
      await expect(reasonInput).toBeVisible();
      await reasonInput.fill("Conteo físico E2E");

      await dialog.getByRole("button", { name: "Guardar cambios" }).click();
      await expect(dialog).toBeHidden();

      // Confirmar en el Backend que se registró el StockMovement con el motivo exacto
      const movRes = await request.get(
        `${API_URL}/movements?batchId=${batchId}&movementType=adjustment`,
      );
      expect(movRes.ok()).toBeTruthy();
      const rawMovements = await movRes.json();
      const movements = Array.isArray(rawMovements)
        ? rawMovements
        : rawMovements.items;
      expect(movements).toHaveLength(1);
      expect(movements[0].quantity).toBe(-3);
      expect(movements[0].reason).toBe("Conteo físico E2E");
    } finally {
      await cleanupItem(request, seeded.id);
    }
  });

  test("permite eliminar lote sin consumo y dar de baja un lote caducado", async ({
    page,
    request,
  }, testInfo) => {
    const suffix = `${Date.now().toString(36)}-${testInfo.project.name}-4`;
    const seeded = await seedItem(request, suffix);

    try {
      await request.post(`${API_URL}/batches`, {
        data: {
          batchNumber: "BORRABLE-01",
          itemId: seeded.id,
          quantity: 5,
          cost: 10,
          expirationDate: "2099-12-31",
        },
      });
      await request.post(`${API_URL}/batches`, {
        data: {
          batchNumber: "CADUCADO-01",
          itemId: seeded.id,
          quantity: 3,
          cost: 10,
          expirationDate: "2020-01-01",
        },
      });

      await goToBatches(page);
      await page
        .getByPlaceholder("Buscar por nombre, SKU, categoría o lote...")
        .fill(seeded.name);

      const card = itemCardOf(page, seeded.name);
      await card.getByRole("button", { name: /Lotes \(2\)/ }).click();

      // Dar de baja lote caducado -> desaparece de lotes vigentes y pasa a agotados
      await card.getByRole("button", { name: "Dar de baja" }).click();
      await page.getByRole("button", { name: "Confirmar baja" }).click();
      await expect(
        card.getByRole("button", { name: "Mostrar agotados (1)" }),
      ).toBeVisible();
      await card.getByRole("button", { name: "Mostrar agotados (1)" }).click();
      await expect(card.getByText("AGOTADO", { exact: true })).toBeVisible();

      // Eliminar lote activo sin consumo
      await card.getByRole("button", { name: "Eliminar" }).click();
      await page.getByRole("button", { name: "Eliminar lote" }).click();
      await expect(card.getByText(`${seeded.sku}-BORRABLE-01`)).toHaveCount(0);
    } finally {
      await cleanupItem(request, seeded.id);
    }
  });
});
