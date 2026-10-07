/**
 * Configuración centralizada de ambientes (dev / qa / prod).
 *
 * Vite expone las variables del archivo `.env.[mode]` a través de `import.meta.env`.
 * - `dev`  -> `vite` (mode development, carga `.env.development`)
 * - `qa`   -> `vite build --mode qa` (carga `.env.qa`)
 * - `prod` -> `vite build` (mode production, carga `.env.production`)
 */

export type AppEnv = 'dev' | 'qa' | 'prod';

function resolveAppEnv(): AppEnv {
  const declared = import.meta.env.VITE_APP_ENV;
  if (declared === 'dev' || declared === 'qa' || declared === 'prod') {
    return declared;
  }

  if (import.meta.env.MODE === 'production') return 'prod';
  if (import.meta.env.MODE === 'qa') return 'qa';
  return 'dev';
}

function resolveApiUrl(): string {
  const url = import.meta.env.VITE_API_URL || '';
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') {
    end -= 1;
  }
  return url.slice(0, end);
}

function resolveUseMock(): boolean {
  const raw = import.meta.env.VITE_USE_MOCK;

  if (raw !== undefined) {
    return String(raw).toLowerCase() === 'true';
  }

  // Default seguro: si no hay API configurada, usar datos mock.
  return resolveApiUrl() === '';
}

export const ENV: {
  MODE: string;
  APP_ENV: AppEnv;
  USE_MOCK: boolean;
  API_URL: string;
} = {
  MODE: import.meta.env.MODE,
  APP_ENV: resolveAppEnv(),
  USE_MOCK: resolveUseMock(),
  API_URL: resolveApiUrl()
};