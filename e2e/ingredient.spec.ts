import { test, expect, type Page } from "@playwright/test";

const CREATE_NAME = "Harina de Prueba E2E";
const CANCEL_NAME = "Ingrediente a Cancelar E2E";
const DELETE_NAME = "Ingrediente a Eliminar E2E";
const EXPAND_NAME = "Ingrediente Expandible E2E";

const CREATE_SKU = "ING-E2E-01";
const CANCEL_SKU = "ING-E2E-02";
const DELETE_SKU = "ING-E2E-03";
const EXPAND_SKU = "ING-E2E-04";

const SEARCH_PLACEHOLDER = "Buscar por nombre, SKU o categoría...";

/**
 * El backend mantiene índices únicos en `name` y `sku` incluso para los
 * ingredientes dados de baja lógica, así que cada proyecto de navegador
 * usa su propio nombre y SKU para poder coexistir en la misma base.
 */
function uniqueName(base: string, project: string) {
  return `${base} ${project}`;
}

function uniqueSku(base: string, project: string) {
  return `${base}-${project}`;
}

async function goToIngredients(page: Page) {
  await page.goto("./");

  /* El primer render del dev server puede tardar (arranque en frío) */
  await expect(
    page.getByRole("heading", { name: "Inventario", level: 1 }),
  ).toBeVisible({ timeout: 30_000 });

  await page
    .getByRole("heading", { name: "Ingredientes", exact: true, level: 2 })
    .click();

  await expect(
    page.getByRole("heading", { name: "Catálogo de Ingredientes", level: 1 }),
  ).toBeVisible();
}

function cardOf(page: Page, name: string) {
  return page.locator(".ingredient-card", {
    has: page.getByRole("heading", { name, level: 3 }),
  });
}

/** Cabecera clicable de la card, responsable de expandir/contraer el detalle. */
function cardHeader(page: Page, name: string) {
  return cardOf(page, name).locator('[role="button"][aria-expanded]');
}

async function expandCard(page: Page, name: string) {
  const header = cardHeader(page, name);
  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "true");
}

async function collapseCard(page: Page, name: string) {
  const header = cardHeader(page, name);
  await header.click();
  await expect(header).toHaveAttribute("aria-expanded", "false");
}

async function confirmDelete(
  page: Page,
  card: ReturnType<typeof cardOf>,
  action: "accept" | "dismiss",
) {
  const dialogPromise = page.waitForEvent("dialog");
  const clickPromise = card.getByRole("button", { name: "Eliminar" }).click();

  const dialog = await dialogPromise;
  const message = dialog.message();
  await dialog[action]();
  await clickPromise;

  return message;
}

async function deleteIfExists(page: Page, name: string) {
  const card = cardOf(page, name);
  if ((await card.count()) === 0) return;

  await confirmDelete(page, card, "accept");
  await expect(card).toHaveCount(0);
}

async function createIngredient(
  page: Page,
  name: string,
  sku: string,
  description = "",
) {
  await deleteIfExists(page, name);

  await page.getByRole("button", { name: "Nuevo ingrediente" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("SKU").fill(sku);
  await dialog.getByLabel("Nombre").fill(name);
  if (description) {
    await dialog.getByLabel("Descripción").fill(description);
  }
  await dialog.getByLabel("Categoría").fill("Abarrotes");
  await dialog.getByLabel("Unidad de medida").selectOption("kg");
  await dialog.getByLabel("Umbral mínimo").fill("10");
  await dialog.getByLabel("Perecedero").selectOption("false");
  await dialog
    .getByLabel("Condición de almacenamiento")
    .selectOption("Refrigerado");

  await dialog.getByRole("button", { name: "Agregar ingrediente" }).click();

  await expect(dialog).toBeHidden();
  await expect(
    page.getByText(`Ingrediente "${name}" agregado al catálogo.`),
  ).toBeVisible();
  await expect(cardOf(page, name)).toHaveCount(1);
}

async function filterBy(page: Page, term: string) {
  await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill(term);
  await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveValue(term);
}

async function shoot(page: Page, file: string) {
  await page.mouse.move(0, 0);
  await expect(page).toHaveScreenshot(file);
}

test.describe("IngredientesPage", () => {
  test("Desde el home entra a Ingredientes y crea un nuevo ingrediente", async ({
    page,
  }, testInfo) => {
    const name = uniqueName(CREATE_NAME, testInfo.project.name);
    const sku = uniqueSku(CREATE_SKU, testInfo.project.name);

    await goToIngredients(page);
    await createIngredient(
      page,
      name,
      sku,
      "Harina de trigo para validar el flujo E2E.",
    );

    // Catálogo filtrado: solo se ve el ingrediente recién creado
    await filterBy(page, "Prueba");
    await expect(cardOf(page, name)).toBeVisible();

    // El SKU se ve al expandir la card del catálogo
    await expandCard(page, name);
    await expect(cardOf(page, name).getByText(sku)).toBeVisible();

    await shoot(page, "crear-ingrediente.png");
  });

  test("Eliminar un ingrediente y cancelar mantiene el catálogo", async ({
    page,
  }, testInfo) => {
    const name = uniqueName(CANCEL_NAME, testInfo.project.name);
    const sku = uniqueSku(CANCEL_SKU, testInfo.project.name);

    await goToIngredients(page);
    await createIngredient(page, name, sku);

    await filterBy(page, "Cancelar");
    const card = cardOf(page, name);
    await expect(card).toBeVisible();

    const message = await confirmDelete(page, card, "dismiss");
    expect(message).toContain(name);

    // Sigue en el catálogo y no hay mensaje de éxito
    await expect(card).toHaveCount(1);
    await expect(
      page.getByText(`Ingrediente "${name}" eliminado`),
    ).toBeHidden();

    await shoot(page, "eliminar-ingrediente-cancelar.png");
  });

  test("Eliminar un ingrediente y aceptar lo quita del catálogo", async ({
    page,
  }, testInfo) => {
    const name = uniqueName(DELETE_NAME, testInfo.project.name);
    const sku = uniqueSku(DELETE_SKU, testInfo.project.name);

    await goToIngredients(page);
    await createIngredient(page, name, sku);

    await filterBy(page, "Eliminar");
    const card = cardOf(page, name);
    await expect(card).toBeVisible();

    const message = await confirmDelete(page, card, "accept");
    expect(message).toContain(name);

    await expect(card).toHaveCount(0);
    await expect(
      page.getByText(`Ingrediente "${name}" eliminado del catálogo.`),
    ).toBeVisible();

    await shoot(page, "eliminar-ingrediente-aceptar.png");
  });

  test("La card de ingrediente se expande y colapsa mostrando todo el detalle", async ({
    page,
  }, testInfo) => {
    const name = uniqueName(EXPAND_NAME, testInfo.project.name);
    const sku = uniqueSku(EXPAND_SKU, testInfo.project.name);

    await goToIngredients(page);
    await createIngredient(
      page,
      name,
      sku,
      "Detalle para validar la expansión de la card.",
    );

    await filterBy(page, "Expandible");
    const card = cardOf(page, name);
    await expect(card).toBeVisible();

    // Cerrada: solo nombre y disponible/mínimo, sin el detalle
    await expect(cardHeader(page, name)).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    await expect(card.getByText(sku)).toBeHidden();

    // Abierta: se muestra todo el detalle
    await expandCard(page, name);
    await expect(card.getByText(sku)).toBeVisible();
    await expect(
      card.getByText("Detalle para validar la expansión de la card."),
    ).toBeVisible();
    await expect(card.getByText("Costo prom.:")).toBeVisible();

    // Cerrada de nuevo: el detalle desaparece
    await collapseCard(page, name);
    await expect(card.getByText(sku)).toBeHidden();
  });
});

/*
 * ---------------------------------------------------------------------------
 * Demo didáctico: fixtures `context`, `browserName` y `request` de Playwright.
 * ---------------------------------------------------------------------------
 * Está comentado para no sumar tests, no generar snapshots ni depender del
 * backend. Descomenta el bloque y ejecuta (backend arriba en :3000):
 *
 *   npx playwright test --grep "Demo de fixtures"
 *
test.describe("Demo de fixtures de Playwright", () => {
  test("context, browserName y request", async ({
    browserName,
    baseURL,
    context,
    request,
    playwright,
  }) => {
    // 1) browserName -> 'chromium' | 'firefox' | 'webkit' según el proyecto.
    console.log(`[browserName] navegador actual: ${browserName}`);
    console.log(`[baseURL] definido en playwright.config.ts: ${baseURL}`);

    // 2) context -> BrowserContext aislado y reutilizable en el test.
    //    Cada test ya recibe uno; aquí abrimos una página extra en el MISMO
    //    contexto, fijamos viewport y bloqueamos peticiones externas.
    await context.route(
      (url) => url.pathname.includes("analytics"),
      (route) => route.abort(),
    );
    const demoPage = await context.newPage();
    await demoPage.setViewportSize({ width: 1280, height: 720 });
    await demoPage.goto("./");
    await expect(
      demoPage.getByRole("heading", { name: "Inventario", level: 1 }),
    ).toBeVisible();
    console.log(
      `[context] páginas abiertas en el contexto: ${context.pages().length}`,
    );
    await demoPage.close();

    // 3) request -> APIRequestContext. Comparte el `baseURL` del config
    //    (el dev server de Vite en :5173), por eso usamos URL absoluta para
    //    pegarle directo al backend en :3000.
    const res = await request.get("http://localhost:3000/ingredients");
    expect(res.ok()).toBeTruthy();
    const ingredients = (await res.json()) as unknown[];
    console.log(`[request] /ingredients devolvió ${ingredients.length} registros`);

    // 3b) Alternativa: crear un contexto de API con su propia baseURL.
    const api = await playwright.request.newContext({
      baseURL: "http://localhost:3000",
    });
    const ping = await api.get("/");
    console.log(`[request.newContext] GET / -> ${ping.status()}`);
    await api.dispose();
  });
});
*/
