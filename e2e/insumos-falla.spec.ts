// tests/insumos-falla.spec.ts
import { test, expect } from "@playwright/test";

test("registrar compra genera notificación de éxito", async ({ page }) => {
  // 1. PREPARAR: Ir a la aplicación
  await page.goto("/");

  // 2. Navegar al módulo de Insumos
  await page.getByRole("heading", { name: "Insumos y Lotes" }).click();
  await expect(
    page.getByRole("heading", { name: "Gestión de Insumos y Lotes" }),
  ).toBeVisible();

  // 3. Abrir el modal de registrar compra
  await page.getByRole("button", { name: /Registrar compra/i }).click();
  await expect(
    page.getByRole("heading", { name: "Registrar Compra a Proveedor" }),
  ).toBeVisible();

  // 4. Rellenar el formulario
  await page.getByLabel("Cantidad comprada").fill("10");
  await page.getByLabel("Costo unitario ($)").fill("45.00");
  await page.getByLabel("Fecha de caducidad").fill("2026-12-31");

  // 5. Guardar
  await page.getByRole("button", { name: "Guardar compra" }).click();

  // 6. VALIDAR: Comprobar el mensaje de confirmación
  // LÍNEA ESTÁ MAL A PROPÓSITO
  await expect(page.locator(".app-notification-toast")).toHaveText(
    "Compra guardada correctamente",
    { timeout: 5000 },
  );
});
