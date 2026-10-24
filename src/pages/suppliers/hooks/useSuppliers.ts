/**
 * Hook que encapsula la lógica de negocio y el acceso a datos del dominio
 * de proveedores. La vista solo consume su resultado.
 *
 * Patrón:
 *   View (JSX) → useSuppliers() → suppliersRepository → HTTP | mock
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { suppliersRepository } from '../../../services/suppliers';
import type {
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
} from '../../../services/suppliers';

export type SaveSupplierInput = SupplierInput & { id?: string };

export interface SupplierFilters {
  search: string;
}

const INITIAL_FILTERS: SupplierFilters = { search: '' };

export interface UseSuppliersResult {
  suppliers: Supplier[];
  filteredSuppliers: Supplier[];
  filters: SupplierFilters;
  updateFilters: (partial: Partial<SupplierFilters>) => void;
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
 * Regex de email con cuantificadores acotados para evitar backtracking
 * super-lineal (SonarCloud: "Simplify this regular expression to reduce
 * its runtime, as it has super-linear performance due to backtracking").
 *
 * Límites:
 *   - Local part: 1-64 caracteres (límite RFC 5321).
 *   - Dominio: 1-255 caracteres.
 *   - TLD: 2+ caracteres.
 * Esto cumple el 99% de los emails reales sin riesgo de ReDoS.
 */
const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

function validateSupplierInput(input: SaveSupplierInput): string | null {
  if (!input.name?.trim()) {
    return 'El nombre del proveedor es obligatorio.';
  }
  // Optional chaining + trim (SonarCloud: "Prefer using an optional chain
  // expression instead, as it's more concise and easier to read").
  const email = input.email?.trim();
  if (email && !EMAIL_REGEX.test(email)) {
    return 'El correo electrónico no tiene un formato válido.';
  }
  return null;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

export function useSuppliers(): UseSuppliersResult {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupplierFilters>(INITIAL_FILTERS);

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

  const updateFilters = useCallback((partial: Partial<SupplierFilters>) => {
    setFilters((prev) => ({ ...prev, ...partial }));
  }, []);

  const filteredSuppliers = useMemo(() => {
    const search = filters.search.trim().toLowerCase();
    if (!search) return suppliers;
    return suppliers.filter((s) => {
      const haystack = [s.name, s.contactName, s.phone, s.email]
        .filter((v): v is string => typeof v === 'string' && v.length > 0)
        .map((v) => v.toLowerCase());
      return haystack.some((v) => v.includes(search));
    });
  }, [suppliers, filters.search]);

  return {
    suppliers,
    filteredSuppliers,
    filters,
    updateFilters,
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