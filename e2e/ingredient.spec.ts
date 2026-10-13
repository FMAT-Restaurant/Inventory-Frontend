import { test, expect, type Page } from "@playwright/test";

const CREATE_NAME = "Harina de Prueba E2E";
const CANCEL_NAME = "Ingrediente a Cancelar E2E";
const DELETE_NAME = "Ingrediente a Eliminar E2E";

const SEARCH_PLACEHOLDER = "Buscar por nombre o categoría...";

async function goToIngredients(page: Page) {
  await page.goto("./");

  await expect(
    page.getByRole("heading", { name: "Inventario", level: 1 }),
  ).toBeVisible();

  await page
    .getByRole("heading", { name: "Ingredientes", exact: true, level: 2 })
    .click();

  await expect(
    page.getByRole("heading", { name: "Catálogo de Ingredientes", level: 1 }),
  ).toBeVisible();
}

function cardOf(page: Page, name: string) {
  return page.locator(".grid-responsive > *", {
    has: page.getByRole("heading", { name, level: 3 }),
  });
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

async function createIngredient(page: Page, name: string) {
  await deleteIfExists(page, name);

  await page.getByRole("button", { name: "Nuevo ingrediente" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  await dialog.getByLabel("Nombre").fill(name);
  await dialog.getByLabel("Categoría").fill("Abarrotes");
  await dialog.getByLabel("Unidad de medida").selectOption("kg");
  await dialog.getByLabel("Umbral mínimo").fill("10");

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
  }) => {
    await goToIngredients(page);
    await createIngredient(page, CREATE_NAME);

    // Catálogo filtrado: solo se ve el ingrediente recién creado
    await filterBy(page, "Prueba");
    await expect(cardOf(page, CREATE_NAME)).toBeVisible();

    await shoot(page, "crear-ingrediente.png");
  });

  test("Eliminar un ingrediente y cancelar mantiene el catálogo", async ({
    page,
  }) => {
    await goToIngredients(page);
    await createIngredient(page, CANCEL_NAME);

    await filterBy(page, "Cancelar");
    const card = cardOf(page, CANCEL_NAME);
    await expect(card).toBeVisible();

    const message = await confirmDelete(page, card, "dismiss");
    expect(message).toContain(CANCEL_NAME);

    // Sigue en el catálogo y no hay mensaje de éxito
    await expect(card).toHaveCount(1);
    await expect(
      page.getByText(`Ingrediente "${CANCEL_NAME}" eliminado`),
    ).toBeHidden();

    await shoot(page, "eliminar-ingrediente-cancelar.png");
  });

  test("Eliminar un ingrediente y aceptar lo quita del catálogo", async ({
    page,
  }) => {
    await goToIngredients(page);
    await createIngredient(page, DELETE_NAME);

    await filterBy(page, "Eliminar");
    const card = cardOf(page, DELETE_NAME);
    await expect(card).toBeVisible();

    const message = await confirmDelete(page, card, "accept");
    expect(message).toContain(DELETE_NAME);

    await expect(card).toHaveCount(0);
    await expect(
      page.getByText(`Ingrediente "${DELETE_NAME}" eliminado del catálogo.`),
    ).toBeVisible();

    await shoot(page, "eliminar-ingrediente-aceptar.png");
  });
});
