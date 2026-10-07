import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { mockService } from '../services/inventory/mockService.js';

const InventoryContext = createContext(null);

export function InventoryProvider({ children }) {
  const [snapshot, setSnapshot] = useState(mockService.getSnapshot());
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState(null);

  // Suscribirse a cambios del store en memoria
  useEffect(() => {
    const unsubscribe = mockService.subscribe(nuevoSnapshot => {
      setSnapshot(nuevoSnapshot);
    });
    return () => unsubscribe();
  }, []);

  const mostrarMensaje = (tipo, texto) => {
    setNotificacion({ tipo, texto });
    setTimeout(() => setNotificacion(null), 5000);
  };

  const guardarIngrediente = useCallback(async data => {
    setCargando(true);
    try {
      const res = await mockService.guardarIngrediente(data);
      mostrarMensaje(
        'success',
        data?.id ? `Ingrediente "${res.nombre}" actualizado.` : `Ingrediente "${res.nombre}" agregado al catálogo.`
      );
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const eliminarIngrediente = useCallback(async ingredienteId => {
    setCargando(true);
    try {
      const res = await mockService.eliminarIngrediente(ingredienteId);
      mostrarMensaje('success', `Ingrediente "${res.nombre}" eliminado del catálogo.`);
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const registrarCompra = useCallback(async ({ providerId, itemsComprados }) => {
    setCargando(true);
    try {
      const res = await mockService.registrarCompraProveedor({ providerId, itemsComprados });
      mostrarMensaje('success', `Compra registrada con éxito. Se generaron ${res.lotesNuevos.length} lote(s).`);
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const reservarComanda = useCallback(async ({ orderId, requestId, platillosPedidos }) => {
    setCargando(true);
    try {
      const res = await mockService.reservarStockComanda({ orderId, requestId, platillosPedidos });
      if (!res.exito) {
        mostrarMensaje('warning', `${res.motivo}. Faltan ${res.faltantes.length} insumo(s).`);
      } else {
        mostrarMensaje('success', `Stock reservado para la orden ${orderId}`);
      }
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const confirmarConsumo = useCallback(async ({ orderId, requestId }) => {
    setCargando(true);
    try {
      const res = await mockService.confirmarConsumoComanda({ orderId, requestId });
      mostrarMensaje('success', `Salida de insumos registrada para la orden ${orderId}. Existencias actualizadas.`);
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const liberarReserva = useCallback(async ({ orderId }) => {
    setCargando(true);
    try {
      const res = await mockService.liberarReservaComanda({ orderId });
      mostrarMensaje('success', `Reserva de orden ${orderId} liberada. Stock devuelto a disponible.`);
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const procesarMermasCaducadas = useCallback(async () => {
    setCargando(true);
    try {
      const res = await mockService.procesarMermasPorCaducidad();
      if (res.procesados > 0) {
        mostrarMensaje('warning', `Se procesaron ${res.procesados} lotes vencidos como merma.`);
      } else {
        mostrarMensaje('info', 'No se encontraron lotes vencidos en almacén.');
      }
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const resetearInventario = useCallback(async () => {
    setCargando(true);
    try {
      await mockService.reset();
      mostrarMensaje('info', 'Inventario restablecido a datos iniciales de prueba.');
    } finally {
      setCargando(false);
    }
  }, []);

  const consumirRecetaDirecta = useCallback(async (plateId, cantidad, options = {}) => {
    setCargando(true);
    try {
      const res = await mockService.consumeRecipe(plateId, cantidad, options);
      if (!res.exito) {
        mostrarMensaje('warning', `${res.motivo}. Faltan ${res.faltantes?.length || 0} insumo(s).`);
      } else {
        mostrarMensaje('success', `Salida de almacén registrada para ${res.porciones} porción(es).`);
      }
      return res;
    } catch (err) {
      mostrarMensaje('error', err.message);
      throw err;
    } finally {
      setCargando(false);
    }
  }, []);

  const value = {
    ...snapshot,
    cargando,
    notificacion,
    guardarIngrediente,
    eliminarIngrediente,
    registrarCompra,
    reservarComanda,
    confirmarConsumo,
    consumirRecetaDirecta,
    liberarReserva,
    procesarMermasCaducadas,
    resetearInventario
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useInventory() {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory debe ser utilizado dentro de un InventoryProvider');
  }
  return context;
}
