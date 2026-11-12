/**
 * Registro de mermas. Solo existe contra el backend real: en modo mock la
 * pantalla de movimientos conserva su simulador local.
 */
export { httpWasteRepository as wasteRepository } from "./httpWasteRepository";
export type {
  ConsumedBatch,
  ServedOrder,
  WasteInput,
  WasteRepository,
} from "./types";
