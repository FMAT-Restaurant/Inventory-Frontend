import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockSuppliersRepository } from './mockSuppliersRepository';
import { mockService } from '../inventory/mockService.js';

/**
 * Tests del repositorio mock de proveedores.
 *
 * Estrategia: no mockeamos `mockService` — usamos el real (es en memoria y
 * rápido). Verificamos:
 *   - El mapeo español -> inglés (nombre -> name, contacto -> contactName, telefono -> phone).
 *   - `getById` encuentra/retorna null correctamente.
 *   - Las escrituras lanzan el error esperado con el mensaje accionable.
 *
 * Cada test hace `vi.spyOn(mockService, 'getProveedores')` para forzar
 * datos deterministas sin depender del `initialData.js` (que podría cambiar).
 * Después de cada test, `vi.restoreAllMocks()` limpia los spies.
 */

const RAW_PROVEEDOR = {
  id: 'prov-1',
  name: 'Molinos del Valle',
  contactName: 'ventas@molinos.com',
  phone: '+52 999 101 2020',
};

describe('mockSuppliersRepository', () => {
  beforeEach(() => {
    vi.spyOn(mockService, 'getProveedores').mockResolvedValue([RAW_PROVEEDOR]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('list', () => {
    it('mapea nombre -> name, contacto -> contactName, telefono -> phone', async () => {
      const result = await mockSuppliersRepository.list();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: 'prov-1',
        name: 'Molinos del Valle',
        contactName: 'ventas@molinos.com',
        phone: '+52 999 101 2020',
      });
      expect(result[0]).not.toHaveProperty('nombre');
      expect(result[0]).not.toHaveProperty('contacto');
      expect(result[0]).not.toHaveProperty('telefono');
    });

    it('devuelve [] si el mock no tiene proveedores', async () => {
      vi.spyOn(mockService, 'getProveedores').mockResolvedValueOnce([]);
      const result = await mockSuppliersRepository.list();
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('devuelve el proveedor mapeado cuando existe', async () => {
      const result = await mockSuppliersRepository.getById('prov-1');
      expect(result).not.toBeNull();
      expect(result!.id).toBe('prov-1');
      expect(result!.name).toBe('Molinos del Valle');
    });

    it('devuelve null cuando no existe', async () => {
      const result = await mockSuppliersRepository.getById('no-existe');
      expect(result).toBeNull();
    });
  });

  describe('escrituras (no soportadas en mock)', () => {
    it('create lanza Error con el mensaje accionable', async () => {
      await expect(
        mockSuppliersRepository.create({ name: 'Nuevo' }),
      ).rejects.toThrow(/modo mock/);
    });

    it('update lanza Error con el mensaje accionable', async () => {
      await expect(
        mockSuppliersRepository.update('prov-1', { phone: '555' }),
      ).rejects.toThrow(/modo mock/);
    });

    it('remove lanza Error con el mensaje accionable', async () => {
      await expect(mockSuppliersRepository.remove('prov-1')).rejects.toThrow(
        /modo mock/,
      );
    });
  });
});