export interface Ingredient {
  id: string;
  nombre: string;
  unidad: string;
  umbralMin: number;
  umbralMax: number;
  stockFisico: number;
  stockDisponible: number;
  estado: 'sano' | 'bajo' | 'critico';
}

export interface Batch {
  id: string;
  numeroLote: string;
  ingredienteId: string;
  cantidad: number;
  fechaCaducidad: string;
  fechaIngreso: string;
  proveedorId: string;
  costo: number;
  estado: 'activo' | 'vence_hoy' | 'vencido' | 'agotado';
  version: number;
}

export interface RecipeItem {
  ingredienteId: string;
  nombre: string;
  cantidadRequerida: number;
  unidad: string;
  stockDisponible: number;
  disponible: boolean;
  costoUnitario: number;
  subtotal: number;
}

export interface Recipe {
  id: string;
  nombre: string;
  costoTotal: number;
  disponible: boolean;
  estado: 'disponible' | 'agotado' | 'incompleta';
  ingredientes: RecipeItem[];
}

export interface Movement {
  id: string;
  tipo: 'ingreso' | 'descuento' | 'reserva' | 'liberacion' | 'ajuste' | 'merma';
  ingredienteId: string;
  loteId: string | null;
  ordenId: string | null;
  cantidad: number;
  motivo: string | null;
  usuario: string;
  fecha: string;
}

export interface Waste {
  id: string;
  ordenId: string | null;
  ingredienteId: string;
  loteId: string;
  cantidad: number;
  motivo: string;
  fecha: string;
  usuario: string;
}

export interface Supplier {
  id: string;
  nombre: string;
  contacto: string;
}

export interface HistoricalCost {
  id: string;
  proveedorId: string;
  ingredienteId: string;
  costo: number;
  fecha: string;
  loteId: string;
}

export interface Reservation {
  id: string;
  ordenId: string;
  platilloId: string;
  ingredienteId: string;
  loteId: string;
  cantidad: number;
  estado: 'activa' | 'consumida' | 'liberada';
  fechaCreacion: string;
}

export interface Alert {
  id: string;
  tipo: 'stock_bajo' | 'receta_agotada' | 'lote_por_vencer' | 'lote_vencido';
  mensaje: string;
  referenciaId: string;
  fecha: string;
}
