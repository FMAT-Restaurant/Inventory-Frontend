/**
 * Reglas de negocio puras para el microservicio de inventario
 * - FEFO (First Expired, First Out) sobre lotes vigentes
 * - No Negativo con cálculo atómico de existencia disponible
 * - Umbrales de Stock (Óptimo, Bajo, Crítico)
 * - Receta Agotada (Disponibilidad y porciones preparables)
 * - Costo Promedio Ponderado (CPP)
 * - Estandarización de unidades base (kg, l, pza)
 * - Aritmética decimal segura (roundQuantity a 4 decimales)
 */

import { EstadoLote, EstadoUmbral } from './types.js';

/**
 * Redondea un número a un número fijo de decimales para evitar imprecisiones de punto flotante en JS.
 * @param {number} num
 * @param {number} decimals
 * @returns {number}
 */
export function roundQuantity(num, decimals = 4) {
  if (typeof num !== 'number' || Number.isNaN(num)) return 0;
  return Number(Math.round(Number(num + 'e' + decimals)) + 'e-' + decimals);
}

/**
 * Aplica el criterio FEFO descontando insumos exclusivamente de los lotes vigentes más próximos a caducar.
 * Descarta automáticamente lotes cuya fecha de caducidad sea anterior a `fechaReferencia`.
 * 
 * @param {Array} lotes - Lista de lotes del ingrediente.
 * @param {number} cantidadADescontar - Cantidad requerida en la unidad base (kg, l, pza).
 * @param {Date|string} fechaReferencia - Fecha base para evaluar caducidad (permite tests deterministas).
 * @returns {Object} { lotesActualizados, trazaDescuentos, cantidadRestante }
 */
export function descontarLotesFEFO(lotes, cantidadADescontar, fechaReferencia = new Date()) {
  const cantidadRedondeada = roundQuantity(cantidadADescontar);
  if (cantidadRedondeada <= 0) {
    return { lotesActualizados: [...lotes], trazaDescuentos: [], cantidadRestante: 0 };
  }

  const refDate = new Date(fechaReferencia);

  // Clonar y ordenar por fecha de caducidad ascendente (FEFO)
  const copiaLotes = lotes.map(l => ({ ...l }));
  copiaLotes.sort((a, b) => new Date(a.fechaCaducidad) - new Date(b.fechaCaducidad));

  let faltante = cantidadRedondeada;
  const trazaDescuentos = [];

  for (const lote of copiaLotes) {
    if (faltante <= 0) break;
    // Solo consumir lotes activos, con saldo > 0 y NO expirados respecto a fechaReferencia
    const esCaducado = new Date(lote.fechaCaducidad) < refDate;
    if (lote.estado !== EstadoLote.ACTIVO || lote.cantidadActual <= 0 || esCaducado) {
      continue;
    }

    const cantidadTomada = roundQuantity(Math.min(lote.cantidadActual, faltante));
    lote.cantidadActual = roundQuantity(lote.cantidadActual - cantidadTomada);
    faltante = roundQuantity(faltante - cantidadTomada);

    if (lote.cantidadActual === 0) {
      lote.estado = EstadoLote.AGOTADO;
    }

    trazaDescuentos.push({
      loteId: lote.id,
      cantidadDescontada: cantidadTomada,
      fechaCaducidad: lote.fechaCaducidad,
      costoUnitario: lote.costoUnitario
    });
  }

  return {
    lotesActualizados: copiaLotes,
    trazaDescuentos,
    cantidadRestante: faltante // > 0 si los lotes vigentes no alcanzaron a cubrir la demanda
  };
}

/**
 * Valida la existencia disponible para evitar saldos negativos.
 * existenciaDisponible = existenciaTotalVigente - stockReservado
 * 
 * @param {number} existenciaTotal
 * @param {number} stockReservado
 * @param {number} cantidadRequerida
 * @returns {Object} { esValido, existenciaDisponible, faltante }
 */
export function validarStockDisponible(existenciaTotal, stockReservado, cantidadRequerida) {
  const disponible = roundQuantity(Math.max(0, existenciaTotal - stockReservado));
  const requerido = roundQuantity(cantidadRequerida);
  const esValido = disponible >= requerido;
  const faltante = esValido ? 0 : roundQuantity(requerido - disponible);

  return {
    esValido,
    existenciaDisponible: disponible,
    faltante
  };
}

/**
 * Determina el estado de umbral de un ingrediente.
 * @param {number} existenciaDisponible
 * @param {number} minimo
 * @returns {string} EstadoUmbral (OPTIMO, BAJO, CRITICO)
 */
export function calcularEstadoUmbral(existenciaDisponible, minimo) {
  const disp = roundQuantity(existenciaDisponible);
  const min = roundQuantity(minimo);

  if (disp <= 0) {
    return EstadoUmbral.CRITICO;
  }
  if (disp <= min) {
    return EstadoUmbral.BAJO;
  }
  return EstadoUmbral.OPTIMO;
}

/**
 * Evalúa si una receta puede prepararse y cuántas porciones máximas se pueden elaborar.
 * Regla de "Receta Agotada": disponible = false cuando unidadesPreparables === 0.
 * 
 * @param {Object} platillo
 * @param {Map<string, { existenciaDisponible, nombre }>} stockIngredientesMap
 * @returns {Object} { plateId, nombre, disponible, unidadesPreparables, ingredientesDetalle, faltantes }
 */
export function evaluarDisponibilidadReceta(platillo, stockIngredientesMap) {
  let porcionesMaximas = Infinity;
  const faltantes = [];
  const ingredientesDetalle = [];

  for (const item of platillo.receta) {
    const stockInfo = stockIngredientesMap.get(item.ingredientId) || {
      existenciaDisponible: 0,
      nombre: 'Desconocido'
    };

    const disp = roundQuantity(stockInfo.existenciaDisponible);
    const req = roundQuantity(item.cantidad);

    const porcionesPosibles = Math.floor(disp / req);
    if (porcionesPosibles < porcionesMaximas) {
      porcionesMaximas = porcionesPosibles;
    }

    const suficiente = disp >= req;
    if (!suficiente) {
      faltantes.push({
        ingredientId: item.ingredientId,
        nombre: stockInfo.nombre,
        requerido: req,
        disponible: disp,
        faltante: roundQuantity(req - disp)
      });
    }

    ingredientesDetalle.push({
      ingredientId: item.ingredientId,
      nombre: stockInfo.nombre,
      cantidadRequerida: req,
      disponible: disp,
      porcionesPosibles
    });
  }

  const unidadesPreparables = porcionesMaximas === Infinity ? 0 : Math.max(0, porcionesMaximas);
  const disponible = unidadesPreparables > 0 && faltantes.length === 0;

  return {
    plateId: platillo.plateId,
    nombre: platillo.nombre,
    disponible,
    unidadesPreparables,
    ingredientesDetalle,
    faltantes
  };
}

/**
 * Calcula el Costo Promedio Ponderado (CPP) tras una nueva compra (RF-16).
 * @param {number} existenciaActual
 * @param {number} cppActual
 * @param {number} cantidadNueva
 * @param {number} costoNuevo
 * @returns {number} nuevoCPP (redondeado a 2 decimales para moneda)
 */
export function calcularCostoPonderado(existenciaActual, cppActual, cantidadNueva, costoNuevo) {
  const stockTotal = roundQuantity(existenciaActual + cantidadNueva);
  if (stockTotal <= 0) return roundQuantity(costoNuevo, 2);

  const valorAnterior = existenciaActual * cppActual;
  const valorNuevo = cantidadNueva * costoNuevo;
  const nuevoCPP = (valorAnterior + valorNuevo) / stockTotal;

  return Number(nuevoCPP.toFixed(2));
}

/**
 * Calcula el costo de insumos de una receta a partir del costo promedio ponderado.
 * @param {Array} receta
 * @param {Map<string, { costoPromedio }>} ingredientesMap
 * @returns {number}
 */
export function calcularCostoProduccion(receta, ingredientesMap) {
  let total = 0;
  for (const item of receta) {
    const ing = ingredientesMap.get(item.ingredientId);
    if (ing) {
      total += item.cantidad * (ing.costoPromedio || 0);
    }
  }
  return Number(total.toFixed(2));
}
