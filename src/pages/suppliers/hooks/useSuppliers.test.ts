import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useSuppliers } from './useSuppliers';
import { suppliersRepository } from '../../../services/suppliers';
import type { Supplier } from '../../../services/suppliers';

/**
 * Tests del hook `useSuppliers`.
 *
 * Estrategia: mockeamos `suppliersRepository` ENTERO con `vi.mock`. Así
 * el hook se prueba en aislamiento, sin depender del mockService ni de
 * fetch. Los tests del repo (HTTP y mock) ya cubren la capa de datos.
 *
 * Se usa `renderHook` de @testing-library/react para ejecutar el hook
 * dentro de un componente virtual y poder llamar `act()` en las
 * actualizaciones de estado.
 */

// Mock del módulo completo. `vi.mock` se hoistea al tope del archivo, así
// que la factory debe declarar los mocks aquí dentro y exportarlos.
vi.mock('../../../services/suppliers', async () => {
  const actual = await vi.importActual<
    typeof import('../../../services/suppliers')
  >('../../../services/suppliers');
  return {
    ...actual, // conserva los tipos exportados y el helper
    suppliersRepository: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
});

// Cast tipado del mock para autocompletado en los tests.
const repo = suppliersRepository as unknown as {
  list: ReturnType<typeof vi.fn>;
  getById: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  remove: ReturnType<typeof vi.fn>;
};

const SUPPLIER: Supplier = {
  id: 'prov-1',
  name: 'Molinos del Valle',
  contactName: 'ventas@molinos.com',
  phone: '+52 999 101 2020',
};

describe('useSuppliers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    repo.list.mockResolvedValue([SUPPLIER]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('expone loading=true inicialmente y false tras reload', async () => {
    const { result } = renderHook(() => useSuppliers());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.suppliers).toEqual([SUPPLIER]);
  });

  it('propaga el error de list al estado error', async () => {
    repo.list.mockRejectedValueOnce(new Error('network down'));
    const { result } = renderHook(() => useSuppliers());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.error).toBe('network down');
    expect(result.current.suppliers).toEqual([]);
  });

  describe('save', () => {
    it('rechaza name vacío y setea error', async () => {
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(
          result.current.save({ name: '   ' }),
        ).rejects.toThrow(/nombre del proveedor es obligatorio/);
      });

      expect(result.current.error).toMatch(/nombre del proveedor es obligatorio/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('rechaza email inválido y setea error', async () => {
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(
          result.current.save({ name: 'X', email: 'no-es-email' }),
        ).rejects.toThrow(/correo electrónico no tiene un formato válido/);
      });

      expect(result.current.error).toMatch(/correo electrónico no tiene un formato válido/);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it('crea si no hay id, setea message, y recarga', async () => {
      repo.create.mockResolvedValueOnce({ ...SUPPLIER, id: 'nuevo' });
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.save({ name: 'Nuevo' });
      });

      expect(repo.create).toHaveBeenCalledWith({ name: 'Nuevo' });
      expect(result.current.message).toMatch(/agregado/);
      // Tras el save hay un reload adicional → list se llamó 2 veces (mount + reload)
      expect(repo.list).toHaveBeenCalledTimes(2);
    });

    it('actualiza si hay id, pasando solo los campos editables', async () => {
      repo.update.mockResolvedValueOnce({ ...SUPPLIER, phone: '555' });
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.save({ id: 'prov-1', name: 'Algún nombre', phone: '555' });
      });

      // El `id` NO se pasa al payload del repo
      expect(repo.update).toHaveBeenCalledWith('prov-1', { name: 'Algún nombre', phone: '555' });
      expect(result.current.message).toMatch(/actualizado/);
    });

    it('propaga el error del repo y setea error', async () => {
      repo.create.mockRejectedValueOnce(
        new Error('Ya existe un proveedor con ese nombre'),
      );
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.save({ name: 'X' })).rejects.toThrow(
          /Ya existe un proveedor/,
        );
      });

      expect(result.current.error).toBe('Ya existe un proveedor con ese nombre');
    });
  });

  describe('remove', () => {
    it('llama al repo, setea message, y recarga', async () => {
      repo.remove.mockResolvedValueOnce(undefined);
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await result.current.remove('prov-1');
      });

      expect(repo.remove).toHaveBeenCalledWith('prov-1');
      expect(result.current.message).toMatch(/eliminado/);
      expect(repo.list).toHaveBeenCalledTimes(2); // mount + reload
    });

    it('propaga el error del repo y setea error', async () => {
      repo.remove.mockRejectedValueOnce(new Error('not found'));
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      await act(async () => {
        await expect(result.current.remove('prov-1')).rejects.toThrow(
          /not found/,
        );
      });

      expect(result.current.error).toBe('not found');
    });
  });

  describe('clearMessage', () => {
    it('limpia error y message', async () => {
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      // Forzamos un error
      repo.list.mockRejectedValueOnce(new Error('boom'));
      await act(async () => {
        await result.current.reload();
      });
      expect(result.current.error).toBe('boom');

      act(() => {
        result.current.clearMessage();
      });
      expect(result.current.error).toBeNull();
      expect(result.current.message).toBeNull();
    });
  });

    describe('filtros', () => {
    const SUPPLIER_A = {
      id: 'prov-1',
      name: 'Molinos del Valle',
      contactName: 'María López',
      phone: '+52 999 111 2233',
      email: 'ventas@molinos.com',
    };
    const SUPPLIER_B = {
      id: 'prov-2',
      name: 'Lácteos del Mayab',
      contactName: 'Pedro Ruiz',
      phone: '+52 999 222 3344',
      email: 'pedidos@lacteosmayab.mx',
    };

    beforeEach(() => {
      repo.list.mockResolvedValue([SUPPLIER_A, SUPPLIER_B]);
    });

    it('sin búsqueda devuelve todos los proveedores', async () => {
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.filteredSuppliers).toHaveLength(2);
    });

    it('filtra por nombre', async () => {
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.updateFilters({ search: 'molinos' }));

      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].id).toBe('prov-1');
    });

    it('filtra por contacto, teléfono o email', async () => {
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.updateFilters({ search: 'pedro' }));
      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].id).toBe('prov-2');

      act(() => result.current.updateFilters({ search: '111 2233' }));
      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].id).toBe('prov-1');

      act(() => result.current.updateFilters({ search: 'lacteosmayab' }));
      expect(result.current.filteredSuppliers).toHaveLength(1);
      expect(result.current.filteredSuppliers[0].id).toBe('prov-2');
    });

    it('devuelve [] si no hay coincidencias', async () => {
      const { result } = renderHook(() => useSuppliers());
      await waitFor(() => expect(result.current.loading).toBe(false));

      act(() => result.current.updateFilters({ search: 'inexistente' }));

      expect(result.current.filteredSuppliers).toHaveLength(0);
    });
  });
  
});