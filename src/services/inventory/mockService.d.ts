/**
 * Declaración de tipos para mockService.js (implementación en JS sin tipos).
 * Solo se declara la superficie que consumen los repositorios tipados del frontend.
 * Si mockService.js añade un método nuevo que se consuma desde TS, actualizar aquí.
 */

export interface MockProveedor {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
}

export interface MockItem {
  id: string;
  nombre: string;
  unidad: string;
  minimo: number;
  costoPromedio: number;
  categoria: string;
  providerIdSugerido: string | null;
  existenciaTotal?: number;
  stockReservado?: number;
  existenciaDisponible?: number;
  estadoUmbral?: string;
  proveedorSugerido?: MockProveedor | null;
}

export interface MockLote {
  id: string;
  itemId: string;
  cantidadInicial: number;
  cantidadActual: number;
  costoUnitario: number;
  fechaCaducidad: string;
  fechaIngreso: string;
  providerId: string;
  estado: string;
}

export interface MockPlatillo {
  plateId: string;
  nombre: string;
  descripcion: string;
  categoria: string;
  precioVenta: number;
  receta: Array<{ itemId: string; cantidad: number }>;
  disponible?: boolean;
  unidadesPreparables?: number;
  itemsDetalle?: unknown[];
  faltantes?: unknown[];
  costoProduccion?: number;
}

export interface MockMovimiento {
  id: string;
  tipo: string;
  fecha: string;
  detalle: Record<string, unknown>;
}

export interface MockSnapshot {
  items: MockItem[];
  lotes: MockLote[];
  platillos: MockPlatillo[];
  proveedores: MockProveedor[];
  reservas: unknown[];
  compras: unknown[];
  mermas: unknown[];
  historialMovimientos: MockMovimiento[];
}

export interface MockService {
  subscribe(listener: (snapshot: MockSnapshot) => void): () => void;
  getSnapshot(fechaReferencia?: Date): MockSnapshot;

  // Insumos
  getItems(fechaReferencia?: Date): Promise<MockItem[]>;
  getItemById(id: string, fechaReferencia?: Date): Promise<MockItem & { lotes: MockLote[] }>;
  saveItem(data: object): Promise<MockItem>;
  deleteItem(id: string): Promise<MockItem>;

  // Proveedores
  getProveedores(): Promise<MockProveedor[]>;

  // Platillos
  getPlatillos(fechaReferencia?: Date): Promise<MockPlatillo[]>;

  // Movimientos
  getMovimientos(): Promise<MockMovimiento[]>;

  // Compras
  registrarCompraProveedor(payload: {
    providerId: string;
    itemsComprados: Array<{
      itemId: string;
      cantidad: number;
      costoUnitario: number;
      fechaCaducidad: string;
    }>;
  }): Promise<{ exito: boolean; compraId: string; lotesNuevos: MockLote[]; mensaje: string }>;

  // Reservas / consumos / mermas
  reservarStockComanda(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  confirmarConsumoComanda(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  liberarReservaComanda(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  consumirRecetaDirecta(plateId: string, cantidad: number, options?: Record<string, unknown>): Promise<Record<string, unknown>>;
  procesarMermasCaducadas(options?: Record<string, unknown>): Promise<Record<string, unknown>>;

  // Reset
  reset(): Promise<{ exito: boolean; mensaje: string }>;
}

export const mockService: MockService;
export default mockService;