import { test, expect } from "@playwright/test";

test("smoke: páginas migradas renderizan sin undefined", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto("./");

  // Insumos
  await page
    .getByRole("heading", { name: "Insumos y Lotes", exact: true, level: 2 })
    .click();
  await expect(page.getByRole("heading", { name: "Harina de Trigo Extra" })).toBeVisible();
  const insumosText = await page.locator(".app-content").innerText();
  expect(insumosText).not.toContain("undefined");
  console.log("INSUMOS OK");

  // Movimientos
  await page.getByRole("button", { name: "Volver al Menú" }).click();
  await page
    .getByRole("heading", { name: "Movimientos de Almacén", exact: true, level: 2 })
    .click();
  await expect(page.getByRole("heading", { name: "Movimientos de Almacén", level: 1 })).toBeVisible();
  const movText = await page.locator(".app-content").innerText();
  expect(movText).not.toContain("undefined");

  // Recetas
  await page.getByRole("button", { name: "Volver al Menú" }).click();
  await page
    .getByRole("heading", { name: "Catálogo y Recetas", exact: true, level: 2 })
    .click();
  await expect(page.getByRole("heading", { name: "Pizza Margarita Clásica" })).toBeVisible();
  const recetasText = await page.locator(".app-content").innerText();
  expect(recetasText).not.toContain("undefined");

  // Ingredientes: costos y categorías ya no son NaN/General-loco
  await page.getByRole("button", { name: "Volver al Menú" }).click();
  await page
    .getByRole("heading", { name: "Ingredientes", exact: true, level: 2 })
    .click();
  await expect(page.getByRole("heading", { name: "Harina de Trigo Extra" })).toBeVisible();
  const loadedText = await page.locator(".app-content").innerText();
  expect(loadedText).not.toContain("NaN");
  expect(loadedText).toContain("$18.50");
  expect(loadedText).toContain("Lácteos");

  expect(errors).toEqual([]);
  console.log("ALL PAGES OK");
});
