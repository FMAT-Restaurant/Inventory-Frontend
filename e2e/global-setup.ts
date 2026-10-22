import type { FullConfig } from "@playwright/test";
import { loadEnv } from "vite";

/**
 * Reset de la base de datos antes de ejecutar la suite E2E.
 *
 * El backend da de baja lógica los ingredientes (`isActive: false`) pero
 * mantiene índices únicos en `name` y `sku`, por lo que un ingrediente con
 * el mismo nombre no se puede volver a crear. El endpoint de test borra la
 * base por completo para que la suite sea idempotente entre ejecuciones.
 *
 * Si el endpoint no está disponible (por ejemplo, en un ambiente donde el
 * guard de test no permite el reset) se avisa y la suite continúa.
 */
const fileEnv = loadEnv("development", process.cwd(), "");

/**
 * Debe apuntar al mismo backend que consume la app (`VITE_API_URL`).
 * Playwright no carga `.env` por sí solo, por eso se lee con `loadEnv`:
 * de lo contrario el reset pega al fallback y la base queda con datos
 * de corridas anteriores (el soft delete bloquea nombre y SKU).
 */
const API_URL =
  process.env.E2E_API_URL ??
  process.env.VITE_API_URL ??
  fileEnv.VITE_API_URL ??
  "http://localhost:3000";

export default async function globalSetup(_config: FullConfig) {
  const url = `${API_URL}/apo/test/reset`;

  try {
    const response = await fetch(url, { method: "DELETE" });

    if (!response.ok) {
      console.warn(
        `[e2e] No se pudo resetear la base (${response.status} ${url}). Se continúa.`,
      );
      return;
    }

    console.log(`[e2e] Base de datos reseteada (${url}).`);
  } catch (error) {
    console.warn(
      `[e2e] No se pudo resetear la base (${url}): ${(error as Error).message}. Se continúa.`,
    );
  }
}
