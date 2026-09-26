export interface IngredientInput {
  nombre: string;
  unidad: string;
  umbralMin: number;
  umbralMax: number;
}

export interface BatchInput {
  ingredienteId: string;
  numeroLote: string;
  cantidad: number;
  fechaCaducidad: string;
  proveedorId: string;
  costo: number;
}

export interface AdjustInput {
  loteId: string;
  ingredienteId: string;
  cantidadRegistrada: number;
  cantidadReal: number;
  motivo: string;
}

export interface WasteInput {
  loteId: string;
  ingredienteId: string;
  cantidad: number;
  motivo: string;
  ordenId?: string;
}

export interface SupplierInput {
  nombre: string;
  contacto: string;
}
