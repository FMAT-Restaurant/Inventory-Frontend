/**
 * Selector de la capa de datos de proveedores.
 *
 * - dev (USE_MOCK=true)        -> mockSuppliersRepository (read-only, datos en memoria)
 * - qa/prod o USE_MOCK=false  -> httpSuppliersRepository (backend NestJS real)
 *
 * `USE_MOCK` se resuelve en `config/env.ts` a partir de `VITE_USE_MOCK` y
 * `VITE_API_URL`. Ver ese archivo para los detalles.
 *
 * El repositorio se elige UNA VEZ al importar el módulo. Es consistente con
 * `services/ingredients/index.ts`.
 */

import { ENV } from '../../config/env';
import { httpSuppliersRepository } from './httpSuppliersRepository';
import { mockSuppliersRepository } from './mockSuppliersRepository';
import type { SuppliersRepository } from './types';

export function getSuppliersRepository(): SuppliersRepository {
  return ENV.USE_MOCK ? mockSuppliersRepository : httpSuppliersRepository;
}

export const suppliersRepository: SuppliersRepository = getSuppliersRepository();

export type {
  Supplier,
  SupplierInput,
  SupplierUpdateInput,
  SuppliersRepository,
} from './types';