import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { loadEnv } from "vite";

const fileEnv = loadEnv("development", process.cwd(), "");
const API_URL =
  process.env.E2E_API_URL ??
  process.env.VITE_API_URL ??
  fileEnv.VITE_API_URL ??
  "http://localhost:8083";

const CREATE_ING_NAME = "Arroz LoteCrear E2E";
const EDIT_ING_NAME = "Arroz LoteEditar E2E";
const CANCEL_ING_NAME = "Arroz LoteCancelar E2E";
const DELETE_ING_NAME = "Arroz LoteEliminar E2E";
const EXPAND_ING_NAME = "Arroz LoteExpandir E2E";

const CREATE_SKU = "ING-BAT-01";
const EDIT_SKU = "ING-BAT-02";
const CANCEL_SKU = "ING-BAT-03";
const DELETE_SKU = "ING-BAT-04";
const EXPAND_SKU = "ING-BAT-05";

const SEARCH_PLACEHOLDER = "Buscar por nombre o categoría...";
const EXPIRATION_DATE = "2027-12-31";

function uniqueName(base: string, project: string) {
  return `${base} ${project}`;
}

function uniqueSku(base: string, project: string) {
  return `${base}-${project.toUpperCase()}`;
}

/**
 * Asegura que el ingrediente exista en el backend y limpia cualquier lote
 * previo asociado a ese ingrediente para que cada test sea idempotente.
 */
async function ensureCleanIngredient(
  request: APIRequestContext,
  name: string,
  sku: string,
) {
  const listRes = await request.get(`${API_URL}/ingredients`);
  let ingredientId = "";

  if (listRes.ok()) {
    const items = (await listRes.json()) as Array<{
      id?: string;
      _id?: string;
      sku?: string;
      name?: string;
    }>;
    const found = items.find(
      (i) => i.sku?.toUpperCase() === sku.toUpperCase() || i.name === name,
    );
    if (found) {
      ingredientId = found.id || found._id || "";
    }
  }

  if (!ingredientId) {
    const createRes = await request.post(`${API_URL}/ingredients`, {
      data: {
        sku,
        name,
        description: "Insumo de prueba para validar lotes E2E.",
        category: "Abarrotes",
        unit: "kg",
        minStock: 10,
        isPerishable: true,
        storageCondition: "Ambiente",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const created = (await createRes.json()) as { id?: string; _id?: string };
    ingredientId = created.id || created._id || "";
  }

  if (ingredientId) {
    const batchesRes = await request.get(
      `${API_URL}/batches?ingredientId=${ingredientId}`,
    );
    if (batchesRes.ok()) {
      const batches = (await batchesRes.json()) as Array<{
        id?: string;
        _id?: string;
      }>;
      for (const batch of batches) {
        const batchId = batch.id || batch._id;
        if (batchId) {
          await request.delete(`${API_URL}/batches/${batchId}`);
        }
      }
    }
  }
}

async function goToBatches(page: Page) {
  await page.goto("./");

  await expect(
    page.getByRole("heading", { name: "Inventario", level: 1 }),
  ).toBeVisible({ timeout: 30_000 });

  await page
    .getByRole("heading", { name: "Insumos y Lotes", exact: true, level: 2 })
    .click();

  await expect(
    page.getByRole("heading", {
      name: "Gestión de Insumos y Lotes",
      level: 1,
    }),
  ).toBeVisible();
}

function cardOf(page: Page, name: string) {
  return page.locator(".batch-ingredient-card", {
    has: page.getByRole("heading", { name, exact: true, level: 3 }),
  });
}

async function filterBy(page: Page, term: string) {
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill(term);
  await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveValue(term);
}

async function createBatchForCard(
  page: Page,
  ingredientName: string,
  sku: string,
  rawBatchCode: string,
  quantity = "20",
  cost = "35",
) {
  const card = cardOf(page, ingredientName);
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: "+ Comprar" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Número de lote (opcional)").fill(rawBatchCode);
  await dialog.getByLabel("Cantidad comprada").fill(quantity);
  await dialog.getByLabel("Costo unitario ($)").fill(cost);
  await dialog.getByLabel("Fecha de caducidad").fill(EXPIRATION_DATE);

  await dialog.getByRole("button", { name: "Guardar compra" }).click();

  const fullBatchCode = `${sku.toUpperCase()}-${rawBatchCode.toUpperCase()}`;

  await expect(dialog).toBeHidden();
  await expect(
    page.getByText(
      `Compra registrada con éxito. Lote "${fullBatchCode}" generado.`,
    ),
  ).toBeVisible();

  return fullBatchCode;
}

async function shoot(page: Page, file: string) {
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot(file);
}

test.describe("BatchesPage", () => {
  test.setTimeout(90_000);

  test("Desde el home entra a Insumos y Lotes y registra una compra de lote", async ({
    page,
    request,
  }, testInfo) => {
    const name = uniqueName(CREATE_ING_NAME, testInfo.project.name);
    const sku = uniqueSku(CREATE_SKU, testInfo.project.name);

    await ensureCleanIngredient(request, name, sku);
    await goToBatches(page);

    await filterBy(page, name);
    const card = cardOf(page, name);
    await expect(card).toBeVisible();
    await expect(card.getByText(sku, { exact: true })).toBeVisible();

    const fullBatchCode = await createBatchForCard(
      page,
      name,
      sku,
      "LOTE-01",
      "20",
      "35",
    );

    // Al registrar compra, la lista de lotes se expande automáticamente y muestra el código SKU + lote
    await expect(card.getByText(fullBatchCode)).toBeVisible();
    await expect(card.getByText("Prioridad de uso")).toBeVisible();
    await expect(card.getByRole("button", { name: "Lotes (1)" })).toBeVisible();

    await shoot(page, "crear-lote.png");
  });

  test("Editar un lote actualiza la cantidad y recalcula el stock del insumo", async ({
    page,
    request,
  }, testInfo) => {
    const name = uniqueName(EDIT_ING_NAME, testInfo.project.name);
    const sku = uniqueSku(EDIT_SKU, testInfo.project.name);

    await ensureCleanIngredient(request, name, sku);
    await goToBatches(page);

    await filterBy(page, name);
    const card = cardOf(page, name);
    const fullBatchCode = await createBatchForCard(
      page,
      name,
      sku,
      "LOTE-EDIT",
      "20",
      "30",
    );

    await card.getByRole("button", { name: "Editar" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Número de lote (opcional)")).toBeDisabled();

    await dialog.getByLabel("Cantidad actual").fill("12");
    await dialog.getByLabel("Costo unitario ($)").fill("40");
    await dialog.getByRole("button", { name: "Guardar cambios" }).click();

    await expect(dialog).toBeHidden();
    await expect(
      page.getByText(`Lote "${fullBatchCode}" actualizado.`),
    ).toBeVisible();
    await expect(card.getByText("12 / 20 kg")).toBeVisible();

    await shoot(page, "editar-lote.png");
  });

  test("Eliminar un lote y cancelar mantiene el lote registrado", async ({
    page,
    request,
  }, testInfo) => {
    const name = uniqueName(CANCEL_ING_NAME, testInfo.project.name);
    const sku = uniqueSku(CANCEL_SKU, testInfo.project.name);

    await ensureCleanIngredient(request, name, sku);
    await goToBatches(page);

    await filterBy(page, name);
    const card = cardOf(page, name);
    const fullBatchCode = await createBatchForCard(
      page,
      name,
      sku,
      "LOTE-CANCEL",
      "15",
      "25",
    );

    await card.getByRole("button", { name: "Eliminar" }).click();

    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog).toContainText(fullBatchCode);

    await confirmDialog.getByRole("button", { name: "Cancelar" }).click();
    await expect(confirmDialog).toBeHidden();

    // El lote permanece intacto en la card
    await expect(card.getByText(fullBatchCode)).toBeVisible();
    await expect(card.getByRole("button", { name: "Lotes (1)" })).toBeVisible();

    await shoot(page, "eliminar-lote-cancelar.png");
  });

  test("Eliminar un lote y aceptar lo quita del inventario", async ({
    page,
    request,
  }, testInfo) => {
    const name = uniqueName(DELETE_ING_NAME, testInfo.project.name);
    const sku = uniqueSku(DELETE_SKU, testInfo.project.name);

    await ensureCleanIngredient(request, name, sku);
    await goToBatches(page);

    await filterBy(page, name);
    const card = cardOf(page, name);
    const fullBatchCode = await createBatchForCard(
      page,
      name,
      sku,
      "LOTE-DEL",
      "15",
      "25",
    );

    await card.getByRole("button", { name: "Eliminar" }).click();

    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await confirmDialog.getByRole("button", { name: "Eliminar lote" }).click();

    await expect(confirmDialog).toBeHidden();
    await expect(
      page.getByText(`Lote "${fullBatchCode}" eliminado.`),
    ).toBeVisible();
    await expect(card.getByRole("button", { name: "Lotes (0)" })).toBeVisible();
    await expect(card.getByText("No hay lotes registrados.")).toBeVisible();

    await shoot(page, "eliminar-lote-aceptar.png");
  });

  test("La card de insumo expande y colapsa la lista de lotes mostrando el detalle", async ({
    page,
    request,
  }, testInfo) => {
    const name = uniqueName(EXPAND_ING_NAME, testInfo.project.name);
    const sku = uniqueSku(EXPAND_SKU, testInfo.project.name);

    await ensureCleanIngredient(request, name, sku);
    await goToBatches(page);

    await filterBy(page, name);
    const card = cardOf(page, name);
    const fullBatchCode = await createBatchForCard(
      page,
      name,
      sku,
      "LOTE-EXP",
      "18",
      "50",
    );

    const toggleBtn = card.getByRole("button", { name: "Lotes (1)" });

    // Tras crear el lote está expandida: se ve el detalle
    await expect(card.getByText(fullBatchCode)).toBeVisible();
    await expect(card.getByText("Costo: $50.00")).toBeVisible();

    // Colapsar: se oculta la lista de lotes
    await toggleBtn.click();
    await expect(card.getByText(fullBatchCode)).toBeHidden();

    // Expandir de nuevo: vuelve a mostrarse
    await toggleBtn.click();
    await expect(card.getByText(fullBatchCode)).toBeVisible();
  });
});
