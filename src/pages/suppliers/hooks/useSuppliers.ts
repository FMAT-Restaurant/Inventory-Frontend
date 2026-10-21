/**
 * Hook que encapsula la lógica de negocio y el acceso a datos del dominio
 * de proveedores. La vista (que construirá otro equipo) solo consume su
 * resultado, igual que `useIngredients` hace para la vista de ingredientes.
 *
 * Patrón:
 *   View (JSX) → useSuppliers() → suppliersRepository → HTTP | mock
 *
 * Comportamiento:
 *   - Carga inicial de suppliers en el mount.
 *   - No hay `subscribe`: si otro componente muta suppliers por fuera,
 *     este hook no se entera. Es adecuado para suppliers porque hoy no
 *     hay otras vistas que muten datos, y añadir reactividad tiene coste
 *     (polling, o instrumentar el mock) sin beneficio claro.
 *   - `save()` valida el input (name obligatorio, email formato válido),
 *     decide create vs update según `input.id`, y recarga.
 *   - `remove()` llama al repo y recarga.
 *   - Errores del repo se propagan como `Error` y se setean en `error`.
 *
 * Consistencia con `useIngredients`: mismos nombres de estado
 * (`loading`, `saving`, `error`, `message`), misma convención de `save`
 * unificado (create si no hay `id`, update si lo hay).
 */

import { useCallback, useEffect, useState } from 'react';
import { suppliersRepository } from '../../../services/suppliers';
import type {
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
} from '../../../services/suppliers';

/**
 * Input de `save`. Si viene `id`, es un update; si no, un create.
 * `id` se separa del `SupplierInput` porque el tipo del frontend lo
 * mantiene limpio (el backend lo genera en Mongo).
 */
export type SaveSupplierInput = SupplierInput & { id?: string };

/**
 * Resultado del hook. La vista usa:
 *   - `suppliers`: para renderizar el listado.
 *   - `loading`: para spinner / skeleton.
 *   - `saving`: para deshabilitar botones mientras se guarda.
 *   - `error` / `message`: para banners.
 *   - `save` / `remove`: para acciones.
 *   - `clearMessage`: para limpiar banners al abrir modales.
 *   - `reload`: para forzar recarga (rara vez se necesita, pero es útil
 *     si la vista quiere un botón "refrescar").
 */
export interface UseSuppliersResult {
  suppliers: Supplier[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  message: string | null;
  clearMessage: () => void;
  reload: () => Promise<void>;
  save: (input: SaveSupplierInput) => Promise<Supplier>;
  remove: (id: string) => Promise<void>;
}

/**
 * Validación de frontend. Se hace ANTES de llamar al repo para dar
 * feedback inmediato sin round-trip. El backend vuelve a validar
 * (ValidationPipe), así que esto es UX, no seguridad.
 *
 * Reglas:
 *   - `name`: obligatorio, no vacío tras trim.
 *   - `email`: si viene, debe parecer un email válido (regex simple).
 *   - `phone`: si viene, no forzamos formato (el backend no lo hace).
 */
function validateSupplierInput(input: SaveSupplierInput): string | null {
  if (!input.name || !input.name.trim()) {
    return 'El nombre del proveedor es obligatorio.';
  }
  if (input.email !== undefined && input.email !== null && input.email !== '') {
    // Regex estándar simplificado. No cubre todos los emails válidos del
    // RFC 5322, pero sí el 99% de los que un usuario escribe. El backend
    // tiene la palabra final con @IsEmail().
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      return 'El correo electrónico no tiene un formato válido.';
    }
  }
  return null;
}

/**
 * Convierte un `Error` arbitrario a string. Mismo helper que usa
 * `useIngredients` (`errorMessage`), replicado aquí para no importar
 * desde `pages/ingredients/`.
 */
function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function useSuppliers(): UseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await suppliersRepository.list();
      setSuppliers(items);
    } catch (err) {
      setError(errorMessage(err, 'No se pudieron cargar los proveedores.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const clearMessage = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  const save = useCallback(
    async (input: SaveSupplierInput): Promise<Supplier> => {
      const validationError = validateSupplierInput(input);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }

      setSaving(true);
      setError(null);
      try {
        let saved: Supplier;
        if (input.id) {
          // Update: separamos id del payload. `SupplierUpdateInput` acepta
          // cualquier subconjunto de SupplierInput, así que solo pasamos
          // los campos editables.
          const { id, ...payload } = input;
          saved = await suppliersRepository.update(
            id,
            payload as SupplierUpdateInput,
          );
          setMessage(`Proveedor "${input.name}" actualizado.`);
        } else {
          saved = await suppliersRepository.create(input as SupplierInput);
          setMessage(`Proveedor "${input.name}" agregado.`);
        }
        await reload();
        return saved;
      } catch (err) {
        setError(errorMessage(err, 'No se pudo guardar el proveedor.'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      setSaving(true);
      setError(null);
      try {
        const target = suppliers.find((s) => s.id === id);
        await suppliersRepository.remove(id);
        setMessage(
          target
            ? `Proveedor "${target.name}" eliminado.`
            : 'Proveedor eliminado.',
        );
        await reload();
      } catch (err) {
        setError(errorMessage(err, 'No se pudo eliminar el proveedor.'));
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [suppliers, reload],
  );

  return {
    suppliers,
    loading,
    saving,
    error,
    message,
    clearMessage,
    reload,
    save,
    remove,
  };
}