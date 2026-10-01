/**
 * Fachada asíncrona pública para el microservicio de inventario (mockService).
 * Ejecuta operaciones en memoria cumpliendo RF-01 al RF-23:
 * - FEFO sobre lotes vigentes (fechaReferencia)
 * - Regla de No Negativo
 * - Umbrales de Stock
 * - Receta Agotada
 * - Costo Promedio Ponderado
 * - Consumo Directo y Transacciones Atómicas
 */

import { inventoryStore } from './store.js';
import {
  calcularCostoPonderado,
  descontarLotesFEFO,
  roundQuantity,
  validarStockDisponible
} from './businessRules.js';
import { EstadoLote, EstadoReserva, EstadoUmbral, TipoMovimiento } from './types.js';

// Retardo leve simulado (ms) para async/await natural
const SIMULATED_DELAY_MS = 60;
const delay = (ms = SIMULATED_DELAY_MS) => new Promise(resolve => setTimeout(resolve, ms));

export const mockService = {
  /**
   * Suscribe un componente o contexto a los cambios del almacén de datos
   */
  subscribe(listener) {
    return inventoryStore.subscribe(listener);
  },

  /**
   * Obtiene la instantánea actual de los datos sin esperar latencia
   */
  getSnapshot(fechaReferencia = new Date()) {
    return inventoryStore.getSnapshot(fechaReferencia);
  },

  /**
   * Restablece el inventario a su estado inicial de prueba
   */
  async reset() {
    await delay(30);
    inventoryStore.reset();
    return { exito: true, mensaje: 'Inventario restablecido a datos iniciales' };
  },

  /**
   * Obtiene todos los ingredientes con su stock consolidado y estado de umbral
   */
  async getIngredientes(fechaReferencia = new Date()) {
    await delay();
    return inventoryStore.getIngredientesConsolidados(fechaReferencia);
  },
  async getIngredients(fechaReferencia = new Date()) {
    return this.getIngredientes(fechaReferencia);
  },

  /**
   * Obtiene un ingrediente por su ID con el desglose de sus lotes
   */
  async getIngredientePorId(id, fechaReferencia = new Date()) {
    await delay();
    const ingrediente = inventoryStore.getIngredientesConsolidados(fechaReferencia).find(i => i.id === id);
    if (!ingrediente) {
      throw new Error(`Ingrediente no encontrado: ${id}`);
    }
    const lotes = inventoryStore.getLotesByIngredient(id);
    return { ...ingrediente, lotes };
  },
  async getIngredientById(id, fechaReferencia = new Date()) {
    return this.getIngredientePorId(id, fechaReferencia);
  },

  /**
   * Obtiene los platillos del menú con su estado de disponibilidad y porciones
   */
  async getPlatillos(fechaReferencia = new Date()) {
    await delay();
    return inventoryStore.getPlatillosConsolidados(fechaReferencia);
  },
  async getRecipes(fechaReferencia = new Date()) {
    return this.getPlatillos(fechaReferencia);
  },

  /**
   * Obtiene los proveedores registrados
   */
  async getProveedores() {
    await delay();
    return [...inventoryStore.proveedores];
  },
  async getSuppliers() {
    return this.getProveedores();
  },

  /**
   * Obtiene el historial de movimientos de almacén (Kardex)
   */
  async getMovimientos() {
    await delay();
    return [...inventoryStore.historialMovimientos];
  },
  async getMovements() {
    return this.getMovimientos();
  },

  /**
   * RF-19 y RF-20: Reporte de ingredientes con existencia actual <= mínimo
   */
  async getAlertasReabastecimiento(fechaReferencia = new Date()) {
    await delay();
    const ingredientes = inventoryStore.getIngredientesConsolidados(fechaReferencia);
    return ingredientes.filter(
      ing => ing.estadoUmbral === EstadoUmbral.BAJO || ing.estadoUmbral === EstadoUmbral.CRITICO
    );
  },

  /**
   * RF-21: Identifica lotes que caducan dentro de una ventana de X días
   */
  async getLotesPorCaducar(diasVentana = 7, fechaReferencia = new Date()) {
    await delay();
    const refDate = new Date(fechaReferencia);
    const limite = new Date(refDate);
    limite.setDate(limite.getDate() + diasVentana);

    return inventoryStore.lotes.filter(lote => {
      if (lote.estado !== EstadoLote.ACTIVO || lote.cantidadActual <= 0) return false;
      const fechaCad = new Date(lote.fechaCaducidad);
      return fechaCad >= refDate && fechaCad <= limite;
    });
  },

  /**
   * RF-22 y RF-23: Identifica lotes ya vencidos y los descarta como Merma
   */
  async procesarMermasPorCaducidad(options = {}) {
    await delay();
    const refDate = new Date(options.fechaReferencia || new Date());
    const lotesCaducados = inventoryStore.lotes.filter(lote => {
      if (lote.estado !== EstadoLote.ACTIVO || lote.cantidadActual <= 0) return false;
      const fechaCad = new Date(lote.fechaCaducidad);
      return fechaCad < refDate;
    });

    const mermasGeneradas = [];

    for (const lote of lotesCaducados) {
      const cantidadPerdida = lote.cantidadActual;
      lote.cantidadActual = 0;
      lote.estado = EstadoLote.CADUCADO;

      const registroMerma = {
        id: `merma-${Date.now()}-${lote.id}`,
        loteId: lote.id,
        ingredientId: lote.ingredientId,
        cantidad: cantidadPerdida,
        motivo: 'Lote caducado en almacén',
        fecha: new Date().toISOString()
      };

      inventoryStore.mermas.push(registroMerma);
      mermasGeneradas.push(registroMerma);

      inventoryStore.historialMovimientos.push({
        id: `mov-${Date.now()}`,
        tipo: TipoMovimiento.MERMA_CADUCIDAD,
        fecha: new Date().toISOString(),
        detalle: registroMerma
      });
    }

    if (mermasGeneradas.length > 0) {
      inventoryStore.notify();
    }

    return {
      procesados: mermasGeneradas.length,
      mermas: mermasGeneradas
    };
  },
  async processExpiredWaste(options = {}) {
    return this.procesarMermasPorCaducidad(options);
  },

  /**
   * RF-13 al RF-18: Registra una compra a proveedor.
   * Genera lotes nuevos, actualiza stock físico y recalcula el CPP.
   */
  async registrarCompraProveedor({ providerId, itemsComprados }) {
    await delay();

    if (!providerId || !itemsComprados || itemsComprados.length === 0) {
      throw new Error('Datos de compra inválidos o incompletos.');
    }

    const compraId = `compra-${Date.now()}`;
    const lotesNuevos = [];

    for (const item of itemsComprados) {
      const { ingredientId, cantidad, costoUnitario, fechaCaducidad } = item;
      const cantidadNum = roundQuantity(Number(cantidad));
      const costoNum = roundQuantity(Number(costoUnitario), 2);

      if (cantidadNum <= 0 || costoNum < 0) {
        throw new Error(`Valores numéricos inválidos para el insumo ${ingredientId}`);
      }

      const ingrediente = inventoryStore.ingredientes.find(i => i.id === ingredientId);
      if (!ingrediente) {
        throw new Error(`Insumo no encontrado: ${ingredientId}`);
      }

      // 1. Recalcular Costo Promedio Ponderado (RF-16)
      const existenciaActual = inventoryStore.getExistenciaTotal(ingredientId);
      const nuevoCPP = calcularCostoPonderado(
        existenciaActual,
        ingrediente.costoPromedio,
        cantidadNum,
        costoNum
      );
      ingrediente.costoPromedio = nuevoCPP;

      // 2. Generar Lote (RF-14 y RF-15)
      const nuevoLote = {
        id: `lot-${Date.now().toString().slice(-4)}-${Math.floor(Math.random() * 1000)}`,
        ingredientId,
        cantidadInicial: cantidadNum,
        cantidadActual: cantidadNum,
        costoUnitario: costoNum,
        fechaCaducidad,
        fechaIngreso: new Date().toISOString().split('T')[0],
        providerId,
        estado: EstadoLote.ACTIVO
      };

      inventoryStore.lotes.push(nuevoLote);
      lotesNuevos.push(nuevoLote);
    }

    const registroCompra = {
      id: compraId,
      providerId,
      fecha: new Date().toISOString(),
      items: itemsComprados,
      lotesGenerados: lotesNuevos.map(l => l.id)
    };

    inventoryStore.compras.push(registroCompra);
    inventoryStore.historialMovimientos.push({
      id: `mov-${Date.now()}`,
      tipo: TipoMovimiento.COMPRA,
      fecha: new Date().toISOString(),
      detalle: registroCompra
    });

    inventoryStore.notify();

    return {
      exito: true,
      compraId,
      lotesNuevos,
      mensaje: 'Compra registrada y existencias actualizadas con éxito'
    };
  },
  async registerPurchase(purchaseData) {
    return this.registrarCompraProveedor(purchaseData);
  },

  /**
   * Consumo directo de una receta sin requerir comanda previa.
   * Aplica FEFO sobre lotes vigentes de forma atómica.
   * 
   * @param {string} plateId - Identificador del platillo
   * @param {number} cantidad - Cantidad de porciones a elaborar
   * @param {Object} options - { fechaReferencia, motivo }
   */
  async consumeRecipe(plateId, cantidad = 1, options = {}) {
    await delay();
    const platillo = inventoryStore.platillos.find(p => p.plateId === plateId);
    if (!platillo) {
      throw new Error(`Platillo no encontrado: ${plateId}`);
    }

    const cantPorciones = Math.max(1, Number(cantidad));
    const fechaRef = options.fechaReferencia || new Date();

    // 1. Calcular ingredientes totales requeridos
    const requeridos = platillo.receta.map(item => ({
      ingredientId: item.ingredientId,
      cantidadRequerida: roundQuantity(item.cantidad * cantPorciones)
    }));

    // 2. Validar existencias disponibles de todos los ingredientes (No Negativo atómico)
    const faltantes = [];
    for (const req of requeridos) {
      const existenciaTotal = inventoryStore.getExistenciaTotal(req.ingredientId, fechaRef);
      const stockReservado = inventoryStore.getStockReservado(req.ingredientId);
      const check = validarStockDisponible(existenciaTotal, stockReservado, req.cantidadRequerida);

      if (!check.esValido) {
        const ing = inventoryStore.ingredientes.find(i => i.id === req.ingredientId);
        faltantes.push({
          ingredientId: req.ingredientId,
          nombre: ing?.nombre || req.ingredientId,
          requerido: req.cantidadRequerida,
          disponible: check.existenciaDisponible,
          faltante: check.faltante
        });
      }
    }

    if (faltantes.length > 0) {
      return {
        exito: false,
        plateId,
        motivo: 'Stock insuficiente para elaborar el platillo',
        faltantes
      };
    }

    // 3. Ejecutar descuento FEFO atómico sobre lotes vigentes
    const trazaConsumoGlobal = [];

    for (const req of requeridos) {
      const lotesIng = inventoryStore.lotes.filter(l => l.ingredientId === req.ingredientId);
      const resultadoFEFO = descontarLotesFEFO(lotesIng, req.cantidadRequerida, fechaRef);

      // Si por alguna razón los lotes vigentes no alcanzaron (ej. caducados), rollback
      if (resultadoFEFO.cantidadRestante > 0) {
        throw new Error(`Inconsistencia en lotes vigentes para el insumo ${req.ingredientId}`);
      }

      // Aplicar mutación a los lotes en el almacén
      for (const loteActualizado of resultadoFEFO.lotesActualizados) {
        const idx = inventoryStore.lotes.findIndex(l => l.id === loteActualizado.id);
        if (idx !== -1) {
          inventoryStore.lotes[idx] = loteActualizado;
        }
      }

      trazaConsumoGlobal.push({
        ingredientId: req.ingredientId,
        cantidadConsumida: req.cantidadRequerida,
        desgloseLotes: resultadoFEFO.trazaDescuentos
      });
    }

    // 4. Registrar movimiento en Kardex
    const detalleMov = {
      orderId: options.orderId || `SAL-${Date.now().toString().slice(-4)}`,
      platillo: platillo.nombre,
      porciones: cantPorciones,
      motivo: options.motivo || 'Salida de almacén por preparación',
      trazaConsumoGlobal
    };

    inventoryStore.historialMovimientos.push({
      id: `mov-${Date.now()}`,
      tipo: TipoMovimiento.CONSUMO_FEFO,
      fecha: new Date().toISOString(),
      detalle: detalleMov
    });

    inventoryStore.notify();

    return {
      exito: true,
      plateId,
      porciones: cantPorciones,
      trazabilidadFEFO: trazaConsumoGlobal,
      mensaje: 'Salida de almacén aplicada correctamente con descuento FEFO'
    };
  },

  /**
   * RF-01 al RF-04, RF-09: Reserva previa de stock para comanda.
   */
  async reservarStockComanda({ orderId, requestId, platillosPedidos, fechaReferencia = new Date() }) {
    await delay();

    if (inventoryStore.hasProcessedRequest(requestId)) {
      return {
        exito: true,
        mensaje: 'Solicitud ya procesada anteriormente (Idempotente)',
        idempotente: true
      };
    }

    // 1. Calcular total de ingredientes requeridos a partir de las recetas
    const consolidadoRequerido = new Map();
    const platillosMap = new Map(inventoryStore.platillos.map(p => [p.plateId, p]));

    for (const pedido of platillosPedidos) {
      const platillo = platillosMap.get(pedido.plateId);
      if (!platillo) {
        throw new Error(`Platillo no encontrado en catálogo: ${pedido.plateId}`);
      }
      for (const ing of platillo.receta) {
        const totalNecesario = roundQuantity(ing.cantidad * pedido.cantidad);
        const acumulado = consolidadoRequerido.get(ing.ingredientId) || 0;
        consolidadoRequerido.set(ing.ingredientId, roundQuantity(acumulado + totalNecesario));
      }
    }

    // 2. Validar existencias disponibles
    const faltantes = [];
    const itemsReserva = [];

    for (const [ingredientId, requerido] of consolidadoRequerido.entries()) {
      const existenciaTotal = inventoryStore.getExistenciaTotal(ingredientId, fechaReferencia);
      const stockReservado = inventoryStore.getStockReservado(ingredientId);
      const check = validarStockDisponible(existenciaTotal, stockReservado, requerido);

      if (!check.esValido) {
        const ing = inventoryStore.ingredientes.find(i => i.id === ingredientId);
        faltantes.push({
          ingredientId,
          nombre: ing?.nombre || ingredientId,
          requerido,
          disponible: check.existenciaDisponible,
          faltante: check.faltante
        });
      } else {
        itemsReserva.push({
          ingredientId,
          cantidad: requerido
        });
      }
    }

    if (faltantes.length > 0) {
      return {
        exito: false,
        orderId,
        motivo: 'Stock insuficiente para preparar la comanda',
        faltantes
      };
    }

    // RF-03: Reservar existencias
    const reserva = {
      orderId,
      requestId,
      fecha: new Date().toISOString(),
      estado: EstadoReserva.RESERVADO,
      platillosPedidos,
      items: itemsReserva
    };

    inventoryStore.reservas.push(reserva);
    inventoryStore.markRequestProcessed(requestId);

    inventoryStore.historialMovimientos.push({
      id: `mov-${Date.now()}`,
      tipo: TipoMovimiento.RESERVA,
      fecha: new Date().toISOString(),
      detalle: reserva
    });

    inventoryStore.notify();

    return {
      exito: true,
      orderId,
      estado: EstadoReserva.RESERVADO,
      mensaje: 'Stock reservado exitosamente para la orden'
    };
  },
  async reserveRecipe(orderId, platillos, options = {}) {
    return this.reservarStockComanda({
      orderId,
      requestId: options.requestId || `REQ-${Date.now()}`,
      platillosPedidos: platillos,
      fechaReferencia: options.fechaReferencia
    });
  },

  /**
   * RF-05, RF-06, RF-07: Convierte la reserva en consumo definitivo aplicando FEFO.
   */
  async confirmarConsumoComanda({ orderId, requestId, fechaReferencia = new Date() }) {
    await delay();

    if (inventoryStore.hasProcessedRequest(requestId)) {
      return { exito: true, mensaje: 'Consumo ya registrado previamente', idempotente: true };
    }

    const reserva = inventoryStore.reservas.find(
      r => r.orderId === orderId && r.estado === EstadoReserva.RESERVADO
    );

    if (!reserva) {
      throw new Error(`No se encontró una reserva activa para la orden ${orderId}`);
    }

    const trazaConsumoGlobal = [];

    // Descontar cada ingrediente reservado aplicando FEFO sobre los lotes vigentes
    for (const item of reserva.items) {
      const lotesIngrediente = inventoryStore.lotes.filter(l => l.ingredientId === item.ingredientId);
      const resultadoFEFO = descontarLotesFEFO(lotesIngrediente, item.cantidad, fechaReferencia);

      for (const loteActualizado of resultadoFEFO.lotesActualizados) {
        const index = inventoryStore.lotes.findIndex(l => l.id === loteActualizado.id);
        if (index !== -1) {
          inventoryStore.lotes[index] = loteActualizado;
        }
      }

      trazaConsumoGlobal.push({
        ingredientId: item.ingredientId,
        cantidadConsumida: item.cantidad,
        desgloseLotes: resultadoFEFO.trazaDescuentos
      });
    }

    reserva.estado = EstadoReserva.CONSUMIDO;
    inventoryStore.markRequestProcessed(requestId);

    inventoryStore.historialMovimientos.push({
      id: `mov-${Date.now()}`,
      tipo: TipoMovimiento.CONSUMO_FEFO,
      fecha: new Date().toISOString(),
      detalle: {
        orderId,
        trazaConsumoGlobal
      }
    });

    inventoryStore.notify();

    return {
      exito: true,
      orderId,
      estado: EstadoReserva.CONSUMIDO,
      trazabilidadFEFO: trazaConsumoGlobal,
      mensaje: 'Salida de insumos aplicada correctamente con descuento de lotes'
    };
  },
  async confirmConsumption(orderId, options = {}) {
    return this.confirmarConsumoComanda({
      orderId,
      requestId: options.requestId || `REQ-CONF-${Date.now()}`,
      fechaReferencia: options.fechaReferencia
    });
  },

  /**
   * RF-08: Libera las reservas de una orden cancelada regresándolas a stock disponible.
   */
  async liberarReservaComanda({ orderId, motivo = 'Cancelación de pedido pendiente' }) {
    await delay();

    const reserva = inventoryStore.reservas.find(
      r => r.orderId === orderId && r.estado === EstadoReserva.RESERVADO
    );

    if (!reserva) {
      throw new Error(`No hay reserva activa pendiente para liberar en la orden ${orderId}`);
    }

    reserva.estado = EstadoReserva.LIBERADO;

    inventoryStore.historialMovimientos.push({
      id: `mov-${Date.now()}`,
      tipo: TipoMovimiento.LIBERACION,
      fecha: new Date().toISOString(),
      detalle: {
        orderId,
        motivo,
        itemsLiberados: reserva.items
      }
    });

    inventoryStore.notify();

    return {
      exito: true,
      orderId,
      estado: EstadoReserva.LIBERADO,
      mensaje: 'Reserva liberada y existencias devueltas al inventario disponible'
    };
  },
  async releaseReservation(orderId) {
    return this.liberarReservaComanda({ orderId });
  }
};
