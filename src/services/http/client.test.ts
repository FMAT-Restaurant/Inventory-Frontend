import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests del cliente HTTP compartido: resolución del token de acceso
 * (sesión de localStorage -> VITE_AUTH_TOKEN) y mensajes de error
 * amigables para 401/403.
 *
 * Como `ENV` se congela al importar el módulo, cada test estiliza las
 * variables de entorno ANTES de importar dinámicamente el cliente
 * (`vi.resetModules` + `import()`).
 */

function mockResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

describe('services/http/client', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  async function loadClient() {
    return await import('./client');
  }

  describe('getAuthToken', () => {
    it('prioriza el token de sesión sobre VITE_AUTH_TOKEN', async () => {
      vi.stubEnv('VITE_AUTH_TOKEN', 'token-de-env');
      localStorage.setItem(
        'fmat_restaurant_auth_session',
        JSON.stringify({ accessToken: 'token-de-sesion' }),
      );

      const { getAuthToken } = await loadClient();
      expect(getAuthToken()).toBe('token-de-sesion');
    });

    it('usa VITE_AUTH_TOKEN cuando no hay sesión', async () => {
      vi.stubEnv('VITE_AUTH_TOKEN', 'token-de-env');

      const { getAuthToken } = await loadClient();
      expect(getAuthToken()).toBe('token-de-env');
    });

    it('no devuelve token cuando no hay sesión ni variable de entorno', async () => {
      const { getAuthToken } = await loadClient();
      expect(getAuthToken()).toBeUndefined();
    });
  });

  describe('request', () => {
    it('envía Authorization: Bearer con el token de VITE_AUTH_TOKEN', async () => {
      vi.stubEnv('VITE_AUTH_TOKEN', 'token-de-env');
      const { request } = await loadClient();
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));

      await request('/items');

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/items$/);
      expect(options.headers.Authorization).toBe('Bearer token-de-env');
    });

    it('envía Authorization: Bearer con el token de la sesión', async () => {
      localStorage.setItem(
        'fmat_restaurant_auth_session',
        JSON.stringify({ accessToken: 'token-de-sesion' }),
      );
      const { request } = await loadClient();
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));

      await request('/items');

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers.Authorization).toBe('Bearer token-de-sesion');
    });

    it('no envía Authorization cuando no hay token', async () => {
      const { request } = await loadClient();
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));

      await request('/items');

      const [, options] = fetchMock.mock.calls[0];
      expect(options.headers.Authorization).toBeUndefined();
    });
  });

  describe('errores 401/403', () => {
    it('mensaje amigable cuando un 403 no incluye mensaje', async () => {
      const { request } = await loadClient();
      fetchMock.mockResolvedValueOnce(
        mockResponse({ statusCode: 403 }, { status: 403 }),
      );

      await expect(request('/items')).rejects.toThrow(
        'No tienes permisos para realizar esta operación.',
      );
    });

    it('mensaje amigable cuando un 401 no incluye mensaje', async () => {
      const { request } = await loadClient();
      fetchMock.mockResolvedValueOnce(
        mockResponse({ statusCode: 401 }, { status: 401 }),
      );

      await expect(request('/items')).rejects.toThrow(
        'Tu sesión ha expirado o no es válida. Inicia sesión nuevamente.',
      );
    });

    it('prioriza el message del backend sobre el mensaje amigable', async () => {
      const { request } = await loadClient();
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          {
            statusCode: 403,
            message: 'Permisos insuficientes para esta operación',
            error: 'Forbidden',
          },
          { status: 403 },
        ),
      );

      await expect(request('/items')).rejects.toThrow(
        'Permisos insuficientes para esta operación',
      );
    });

    it('mantiene el formato genérico para otros códigos de error', async () => {
      const { request } = await loadClient();
      fetchMock.mockResolvedValueOnce(
        mockResponse({ statusCode: 502 }, { status: 502 }),
      );

      await expect(request('/items')).rejects.toThrow(
        /Error 502 al consumir \/items/,
      );
    });
  });
});
