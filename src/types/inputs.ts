export interface ItemInput {
  nombre: string;
  unidad: string;
  umbralMin: number;
  umbralMax: number;
}

export interface BatchInput {
  itemId: string;
  numeroLote: string;
  cantidad: number;
  fechaCaducidad: string;
  proveedorId: string;
  costo: number;
}

export interface AdjustInput {
  loteId: string;
  itemId: string;
  cantidadRegistrada: number;
  cantidadReal: number;
  motivo: string;
}

export interface WasteInput {
  loteId: string;
  itemId: string;
  cantidad: number;
  motivo: string;
  ordenId?: string;
}

export interface SupplierInput {
  nombre: string;
  contacto: string;
}
