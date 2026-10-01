/**
 * Almacén en memoria (InMemoryStore) para el estado del microservicio de inventario.
 * Gestiona colecciones, transacciones, idempotencia y notificación reactiva a suscriptores.
 */

import {
  initialIngredientes,
  initialLotes,
  initialPlatillos,
  initialProveedores
} from './initialData.js';
import {
  calcularCostoProduccion,
  calcularEstadoUmbral,
  evaluarDisponibilidadReceta,
  roundQuantity
} from './businessRules.js';
import { EstadoLote, EstadoReserva } from './types.js';

class InventoryStore {
  constructor() {
    this.listeners = new Set();
    this.processedRequests = new Set();
    this.reset();
  }

  /**
   * Restablece el estado completo a los datos semilla iniciales
   */
  reset() {
    this.proveedores = JSON.parse(JSON.stringify(initialProveedores));
    this.ingredientes = JSON.parse(JSON.stringify(initialIngredientes));
    this.lotes = JSON.parse(JSON.stringify(initialLotes));
    this.platillos = JSON.parse(JSON.stringify(initialPlatillos));
    this.reservas = []; // [{ orderId, requestId, estado, items: [{ ingredientId, cantidad }] }]
    this.compras = [];
    this.mermas = [];
    this.historialMovimientos = [];
    this.processedRequests.clear();
    this.notify();
  }

  /**
   * Suscribe un listener para ser notificado cuando el estado cambie
   * @param {Function} listener
   * @returns {Function} Desuscriptor
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.getSnapshot());
      } catch (err) {
        console.error('Error en listener de InventoryStore:', err);
      }
    }
  }

  /**
   * Verifica si un requestId ya fue procesado para asegurar idempotencia (RF-09).
   */
  hasProcessedRequest(requestId) {
    if (!requestId) return false;
    return this.processedRequests.has(requestId);
  }

  markRequestProcessed(requestId) {
    if (requestId) {
      this.processedRequests.add(requestId);
    }
  }

  /**
   * Obtiene la suma de stock reservado activo para un ingrediente
   */
  getStockReservado(ingredientId) {
    const totalReservado = this.reservas
      .filter(r => r.estado === EstadoReserva.RESERVADO)
      .reduce((acc, r) => {
        const item = r.items.find(i => i.ingredientId === ingredientId);
        return acc + (item ? item.cantidad : 0);
      }, 0);
    return roundQuantity(totalReservado);
  }

  /**
   * Obtiene los lotes de un ingrediente
   */
  getLotesByIngredient(ingredientId) {
    return this.lotes.filter(l => l.ingredientId === ingredientId);
  }

  /**
   * Obtiene la existencia física total vigente (lotes activos y no vencidos respecto a fechaReferencia)
   * @param {string} ingredientId
   * @param {Date|string} fechaReferencia
   */
  getExistenciaTotal(ingredientId, fechaReferencia = new Date()) {
    const refDate = new Date(fechaReferencia);
    const totalVigente = this.lotes
      .filter(l => {
        if (l.ingredientId !== ingredientId || l.estado !== EstadoLote.ACTIVO || l.cantidadActual <= 0) {
          return false;
        }
        return new Date(l.fechaCaducidad) >= refDate;
      })
      .reduce((acc, l) => acc + l.cantidadActual, 0);

    return roundQuantity(totalVigente);
  }

  /**
   * Genera la lista consolidada de ingredientes con stock físico vigente, reservado, disponible y umbrales
   */
  getIngredientesConsolidados(fechaReferencia = new Date()) {
    return this.ingredientes.map(ing => {
      const existenciaTotal = this.getExistenciaTotal(ing.id, fechaReferencia);
      const stockReservado = this.getStockReservado(ing.id);
      const existenciaDisponible = roundQuantity(Math.max(0, existenciaTotal - stockReservado));
      const estadoUmbral = calcularEstadoUmbral(existenciaDisponible, ing.minimo);
      const proveedorSugerido = this.proveedores.find(p => p.id === ing.providerIdSugerido);

      return {
        ...ing,
        existenciaTotal,
        stockReservado,
        existenciaDisponible,
        estadoUmbral,
        proveedorSugerido
      };
    });
  }

  /**
   * Retorna los platillos con disponibilidad, recetas agotadas y costo de insumos calculado
   */
  getPlatillosConsolidados(fechaReferencia = new Date()) {
    const ingredientesConsolidados = this.getIngredientesConsolidados(fechaReferencia);
    const stockMap = new Map(
      ingredientesConsolidados.map(ing => [
        ing.id,
        { existenciaDisponible: ing.existenciaDisponible, nombre: ing.nombre, costoPromedio: ing.costoPromedio }
      ])
    );

    return this.platillos.map(platillo => {
      const evaluacion = evaluarDisponibilidadReceta(platillo, stockMap);
      const costoProduccion = calcularCostoProduccion(platillo.receta, stockMap);

      return {
        ...platillo,
        disponible: evaluacion.disponible,
        unidadesPreparables: evaluacion.unidadesPreparables,
        ingredientesDetalle: evaluacion.ingredientesDetalle,
        faltantes: evaluacion.faltantes,
        costoProduccion
      };
    });
  }

  /**
   * Devuelve un snapshot completo del estado para la UI
   */
  getSnapshot(fechaReferencia = new Date()) {
    return {
      ingredientes: this.getIngredientesConsolidados(fechaReferencia),
      lotes: [...this.lotes],
      platillos: this.getPlatillosConsolidados(fechaReferencia),
      proveedores: [...this.proveedores],
      reservas: [...this.reservas],
      compras: [...this.compras],
      mermas: [...this.mermas],
      historialMovimientos: [...this.historialMovimientos]
    };
  }
}

// Exportar instancia singleton
export const inventoryStore = new InventoryStore();
