import { useState } from 'react';
import { useInventory } from '../context/InventoryContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Select } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  AlertCircleIcon,
  PlusIcon
} from '../components/ui/Icons.jsx';

export function MovimientosPage() {
  const {
    historialMovimientos,
    ingredientes,
    platillos,
    consumirRecetaDirecta,
    procesarMermasCaducadas,
    cargando
  } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tipoSalida, setTipoSalida] = useState('PREPARACION'); // 'PREPARACION' | 'MERMA'
  const [itemSeleccionado, setItemSeleccionado] = useState(platillos[0]?.plateId || '');
  const [cantidad, setCantidad] = useState(1);
  const [motivo, setMotivo] = useState('Salida autorizada de almacén');

  const handleAbrirModal = () => {
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
  };

  const handleRegistrarSalida = async e => {
    e.preventDefault();
    try {
      if (tipoSalida === 'PREPARACION') {
        const res = await consumirRecetaDirecta(itemSeleccionado, Number(cantidad), { motivo });
        if (!res?.exito) {
          alert(`No fue posible despachar: ${res?.motivo || 'Stock insuficiente'}`);
          return;
        }
      } else {
        // Merma / Descarte de vencidos
        await procesarMermasCaducadas();
      }

      setIsModalOpen(false);
      setCantidad(1);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header de la sección */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <p style={{ fontSize: 'var(--small-size)', color: 'var(--color-muted)' }}>
            Registro de entradas, salidas y mermas.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={handleAbrirModal}>
          <PlusIcon size={16} />
          <span>Registrar salida de insumos</span>
        </Button>
      </div>

      {/* Tabla / Lista de Movimientos */}
      <Card padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: 'var(--small-size)'
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-canvas)',
                  color: 'var(--color-muted)',
                  fontSize: 'var(--caption-size)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Fecha y Hora</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Tipo de Movimiento</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Detalle de Operación</th>
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Trazabilidad de Lotes</th>
              </tr>
            </thead>
            <tbody>
              {historialMovimientos.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-muted)' }}>
                    No hay movimientos registrados en el período actual.
                  </td>
                </tr>
              ) : (
                historialMovimientos
                  .slice()
                  .reverse()
                  .map(mov => {
                    const esEntrada = mov.tipo === 'COMPRA';
                    const esSalida = mov.tipo === 'CONSUMO_FEFO';
                    const esMerma = mov.tipo.includes('MERMA');
                    const esReserva = mov.tipo === 'RESERVA';

                    return (
                      <tr
                        key={mov.id}
                        style={{
                          borderBottom: '1px solid var(--color-border)',
                          transition: 'background-color 0.15s ease'
                        }}
                      >
                        {/* Fecha */}
                        <td style={{ padding: '16px 20px', whiteSpace: 'nowrap', color: 'var(--color-muted)' }}>
                          {new Date(mov.fecha).toLocaleString()}
                        </td>

                        {/* Tipo con Badge */}
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            {esEntrada && (
                              <Badge variant="success">
                                <ArrowDownLeftIcon size={14} />
                                <span>Entrada (Compra)</span>
                              </Badge>
                            )}
                            {esSalida && (
                              <Badge variant="warning">
                                <ArrowUpRightIcon size={14} />
                                <span>Salida por servicio</span>
                              </Badge>
                            )}
                            {esMerma && (
                              <Badge variant="danger">
                                <AlertCircleIcon size={14} />
                                <span>Baja por merma</span>
                              </Badge>
                            )}
                            {esReserva && (
                              <Badge variant="neutral">
                                <span>Apartado previo</span>
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Detalle */}
                        <td style={{ padding: '16px 20px', color: 'var(--color-ink)' }}>
                          {esEntrada && (
                            <span>
                              Reabastecimiento con {mov.detalle.items?.length || 1} insumo(s) recibido(s).
                            </span>
                          )}
                          {esSalida && (
                            <span>
                              Despacho completado para orden <strong>{mov.detalle.orderId}</strong>.
                            </span>
                          )}
                          {esMerma && (
                            <span>
                              {mov.detalle.motivo || 'Descarte de producto por vencimiento'}.
                            </span>
                          )}
                          {esReserva && (
                            <span>
                              Insumos comprometidos para comanda <strong>{mov.detalle.orderId}</strong>.
                            </span>
                          )}
                        </td>

                        {/* Trazabilidad de lotes */}
                        <td style={{ padding: '16px 20px', color: 'var(--color-muted)' }}>
                          {esEntrada && (
                            <span style={{ fontSize: 'var(--caption-size)' }}>
                              Lotes creados: {mov.detalle.lotesGenerados?.join(', ') || 'N/A'}
                            </span>
                          )}
                          {esSalida && mov.detalle.trazaConsumoGlobal ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {mov.detalle.trazaConsumoGlobal.map(t => {
                                const nombreIng = ingredientes.find(i => i.id === t.ingredientId)?.nombre || t.ingredientId;
                                return (
                                  <span key={t.ingredientId} style={{ fontSize: 'var(--caption-size)' }}>
                                    • {nombreIng}: {t.desgloseLotes.map(l => `${l.loteId} (-${l.cantidadDescontada})`).join(', ')}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span style={{ fontSize: 'var(--caption-size)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Registrar Salida de Insumos */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCerrarModal}
        title="Registrar Salida de Insumos"
      >
        <form onSubmit={handleRegistrarSalida} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Tipo de salida"
            value={tipoSalida}
            onChange={e => setTipoSalida(e.target.value)}
          >
            <option value="PREPARACION">Salida por preparación de platillo</option>
            <option value="MERMA">Baja por merma de lotes caducados</option>
          </Select>

          {tipoSalida === 'PREPARACION' ? (
            <>
              <Select
                label="Platillo a despachar"
                value={itemSeleccionado}
                onChange={e => setItemSeleccionado(e.target.value)}
                required
              >
                {platillos.map(p => (
                  <option key={p.plateId} value={p.plateId}>
                    {p.nombre} ({p.disponible ? `${p.unidadesPreparables} disp.` : 'Sin existencias'})
                  </option>
                ))}
              </Select>

              <Input
                label="Porciones a despachar"
                type="number"
                min="1"
                max="50"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                required
                helperText="Los insumos se descontarán automáticamente de los lotes más próximos a vencer."
              />
            </>
          ) : (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-control)',
                backgroundColor: 'var(--bg-warning)',
                color: 'var(--color-warning)',
                fontSize: 'var(--small-size)'
              }}
            >
              Esta acción escaneará el almacén y dará de baja todos los lotes cuya fecha de caducidad haya sido superada.
            </div>
          )}

          <Input
            label="Motivo o Justificación"
            value={motivo}
            onChange={e => setMotivo(e.target.value)}
            required
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <Button variant="tertiary" onClick={handleCerrarModal} disabled={cargando}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={cargando}>
              {cargando ? 'Procesando...' : 'Confirmar salida'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
