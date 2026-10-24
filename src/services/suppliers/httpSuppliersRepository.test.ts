import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { httpSuppliersRepository } from './httpSuppliersRepository';

/**
 * Tests del repositorio HTTP de proveedores.
 *
 * Estrategia: `fetch` global se reemplaza con un mock de Vitest. Cada test
 * configura lo que el mock "responde" y verifica que el repo:
 *   - hace la petición correcta (URL, método, headers, body)
 *   - normaliza la respuesta (`_id` -> `id`, descarta `__v`)
 *   - maneja errores del backend (extrae `message`)
 *   - respeta el contrato (404 en getById -> null, 204 en remove -> void)
 *
 * No se hace ninguna petición real. Todos los tests corren en milisegundos.
 */

/** Respuesta "cruda" típica del backend NestJS (con `_id` y `__v`). */
const RAW_SUPPLIER = {
  _id: '6ad78bd3e87a342c9ebbc822',
  name: 'Proveedor Central',
  contactName: 'Juan Dominguez',
  phone: '+52 55 1234 2345',
  email: 'contacto12@proveedor.com',
  address: 'Av. Reforma 1233, CDMX',
  createdAt: '2026-10-20T15:42:11.715Z',
  updatedAt: '2026-10-20T15:42:11.715Z',
  __v: 0,
};

/**
 * Crea una respuesta HTTP falsa a partir del body y del status.
 * `fetch` en jsdom devuelve un `Response`, pero el repo solo usa
 * `.ok`, `.status`, `.json()`. Con un objeto que los exponga basta.
 */
function mockResponse(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

describe('httpSuppliersRepository', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('hace GET a /suppliers y normaliza _id -> id, descartando __v', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse([RAW_SUPPLIER, { ...RAW_SUPPLIER, _id: 'otro-id' }]),
      );

      const result = await httpSuppliersRepository.list();

      // Verifica la petición
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/suppliers$/);
      expect(options.method).toBeUndefined(); // GET implícito
      expect(options.headers['Content-Type']).toBe('application/json');

      // Verifica la normalización
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '6ad78bd3e87a342c9ebbc822',
        name: 'Proveedor Central',
        contactName: 'Juan Dominguez',
        phone: '+52 55 1234 2345',
        email: 'contacto12@proveedor.com',
        address: 'Av. Reforma 1233, CDMX',
        createdAt: '2026-10-20T15:42:11.715Z',
        updatedAt: '2026-10-20T15:42:11.715Z',
      });
      expect(result[0]).not.toHaveProperty('_id');
      expect(result[0]).not.toHaveProperty('__v');
      expect(result[1].id).toBe('otro-id');
    });

    it('devuelve [] si el backend devuelve []', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse([]));
      const result = await httpSuppliersRepository.list();
      expect(result).toEqual([]);
    });

    it('propaga el message de error del backend (string)', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { statusCode: 500, message: 'Error interno del servidor', error: 'Internal' },
          { status: 500 },
        ),
      );

      await expect(httpSuppliersRepository.list()).rejects.toThrow(
        'Error interno del servidor',
      );
    });

    it('une múltiples mensajes de validación (array) con "; "', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          {
            statusCode: 400,
            message: ['name should not be empty', 'email must be an email'],
            error: 'Bad Request',
          },
          { status: 400 },
        ),
      );

      await expect(httpSuppliersRepository.list()).rejects.toThrow(
        'name should not be empty; email must be an email',
      );
    });

    it('lanza un mensaje genérico si el body de error no es JSON parseable', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('not json');
        },
      } as unknown as Response);

      await expect(httpSuppliersRepository.list()).rejects.toThrow(
        /Error 502 al consumir \/suppliers/,
      );
    });
  });

  describe('getById', () => {
    it('hace GET a /suppliers/:id y normaliza', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(RAW_SUPPLIER));

      const result = await httpSuppliersRepository.getById('6ad78bd3e87a342c9ebbc822');

      const [url] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/suppliers\/6ad78bd3e87a342c9ebbc822$/);
      expect(result).not.toBeNull();
      expect(result!.id).toBe('6ad78bd3e87a342c9ebbc822');
      expect(result).not.toHaveProperty('_id');
    });

    it('devuelve null cuando el backend responde 404', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse(
          { statusCode: 404, message: 'Proveedor con id X no encontrado', error: 'Not Found' },
          { status: 404 },
        ),
      );

      const result = await httpSuppliersRepository.getById('inexistente');
      expect(result).toBeNull();
    });

    it('devuelve null ante un error de red', async () => {
      fetchMock.mockRejectedValueOnce(new Error('network down'));
      const result = await httpSuppliersRepository.getById('cualquiera');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('hace POST con el body serializado y normaliza la respuesta', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(RAW_SUPPLIER, { status: 201 }));

      const input = {
        name: 'Proveedor Central',
        contactName: 'Juan Dominguez',
        phone: '+52 55 1234 2345',
        email: 'contacto12@proveedor.com',
        address: 'Av. Reforma 1233, CDMX',
      };
      const result = await httpSuppliersRepository.create(input);

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/suppliers$/);
      expect(options.method).toBe('POST');
      expect(JSON.parse(options.body)).toEqual(input);
      expect(result.id).toBe('6ad78bd3e87a342c9ebbc822');
    });
    it('propaga el mensaje de conflicto (409) al crear un duplicado', async () => {
        fetchMock.mockResolvedValueOnce(
            mockResponse(
            {
                statusCode: 409,
                message: "Ya existe un proveedor con el nombre 'Proveedor Central'",
                error: 'Conflict',
            },
            { status: 409 },
            ),
        );

        await expect(
            httpSuppliersRepository.create({ name: 'Proveedor Central' }),
        ).rejects.toThrow("Ya existe un proveedor con el nombre 'Proveedor Central'");
        });
    
    
  });

  describe('update', () => {
    it('usa PATCH (no PUT) y normaliza la respuesta', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ ...RAW_SUPPLIER, phone: '+52 55 0000 0000' }),
      );

      const result = await httpSuppliersRepository.update('6ad78bd3e87a342c9ebbc822', {
        phone: '+52 55 0000 0000',
      });

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/suppliers\/6ad78bd3e87a342c9ebbc822$/);
      expect(options.method).toBe('PATCH');
      expect(JSON.parse(options.body)).toEqual({ phone: '+52 55 0000 0000' });
      expect(result.phone).toBe('+52 55 0000 0000');
      expect(result).not.toHaveProperty('_id');
    });
  });

  describe('remove', () => {
    it('hace DELETE y resuelve con void', async () => {
      // El backend responde 200 con body vacío o 204. Probamos 204 (no body).
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => {
          throw new Error('no debería llamarse');
        },
      } as unknown as Response);

      await expect(
        httpSuppliersRepository.remove('6ad78bd3e87a342c9ebbc822'),
      ).resolves.toBeUndefined();

      const [url, options] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/suppliers\/6ad78bd3e87a342c9ebbc822$/);
      expect(options.method).toBe('DELETE');
    });
  });
});