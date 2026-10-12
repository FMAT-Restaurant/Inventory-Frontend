import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:5173/Inventory-Frontend/');
  await page.getByRole('button', { name: 'Ingresar' }).first().click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Eliminar' }).nth(2).click();
  await page.getByRole('button', { name: 'Volver al Menú' }).click();
});