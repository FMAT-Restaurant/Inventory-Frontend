import { useState } from 'react';
import { useInventory } from '../context/InventoryContext.jsx';
import { ENV } from '../config/env';
import { useMovements } from './movements/hooks/useMovements';
import { WasteFormModal } from './movements/components/WasteFormModal.jsx';
import { useAuth } from '../context/AuthContext';
import { PERMISSIONS } from '../config/permissions';
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

const MOVEMENT_META = {
  in: { label: 'Entrada', variant: 'success', Icon: ArrowDownLeftIcon },
  out: { label: 'Salida', variant: 'warning', Icon: ArrowUpRightIcon },
  waste: { label: 'Merma', variant: 'danger', Icon: AlertCircleIcon },
  adjustment: { label: 'Ajuste', variant: 'neutral', Icon: null }
};

function formatQuantity(movement) {
  const sign = movement.movementType === 'adjustment' && movement.quantity > 0 ? '+' : '';
  return `${sign}${movement.quantity}`;
}

function movementDetail(movement) {
  const quantity = formatQuantity(movement);
  switch (movement.movementType) {
    case 'in':
      return `Ingreso de ${quantity}.`;
    case 'out':
      return `Salida de ${quantity}.`;
    case 'waste':
      return `Baja por merma de ${quantity}.`;
    default:
      return `Ajuste de inventario: ${quantity}.`;
  }
}

export function MovimientosPage() {
  const { rows, loading, error, reload } = useMovements();
  const {
    platillos,
    consumirRecetaDirecta,
    procesarMermasCaducadas,
    cargando
  } = useInventory();

  const { can } = useAuth();
  // Registrar merma requiere ver órdenes servidas y escribir en lotes.
  const canRegisterWaste =
    !ENV.USE_MOCK &&
    can(PERMISSIONS.BATCHES_WRITE) &&
    can(PERMISSIONS.RESERVATIONS_READ);
  const [isWasteOpen, setIsWasteOpen] = useState(false);
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
            Registro de entradas, salidas, mermas y ajustes.
          </p>
        </div>

        {canRegisterWaste && (
          <Button variant="primary" size="md" onClick={() => setIsWasteOpen(true)}>
            <PlusIcon size={16} />
            <span>Registrar merma</span>
          </Button>
        )}

        {ENV.USE_MOCK && (
          <Button variant="primary" size="md" onClick={handleAbrirModal}>
            <PlusIcon size={16} />
            <span>Registrar salida de insumos</span>
          </Button>
        )}
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
                <th style={{ padding: '14px 20px', fontWeight: 600 }}>Insumo / Lote</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-muted)' }}>
                    Cargando movimientos de almacén...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-danger)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <span>{error}</span>
                      <Button variant="tertiary" size="sm" onClick={reload}>
                        Reintentar
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-muted)' }}>
                    No hay movimientos registrados en el período actual.
                  </td>
                </tr>
              ) : (
                rows.map(mov => {
                  const meta = MOVEMENT_META[mov.movementType] ?? MOVEMENT_META.adjustment;
                  const Icon = meta.Icon;

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
                        {mov.createdAt ? new Date(mov.createdAt).toLocaleString() : '—'}
                      </td>

                      {/* Tipo con Badge */}
                      <td style={{ padding: '16px 20px' }}>
                        <Badge variant={meta.variant}>
                          {Icon && <Icon size={14} />}
                          <span>{meta.label}</span>
                        </Badge>
                      </td>

                      {/* Detalle */}
                      <td style={{ padding: '16px 20px', color: 'var(--color-ink)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span>{movementDetail(mov)}</span>
                          {mov.reason && (
                            <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-muted)' }}>
                              {mov.reason}
                            </span>
                          )}
                          {mov.referenceId && (
                            <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-muted)' }}>
                              Referencia: <strong>{mov.referenceId}</strong>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Insumo / Lote */}
                      <td style={{ padding: '16px 20px', color: 'var(--color-muted)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span>{mov.itemName || 'Insumo no disponible'}</span>
                          <span style={{ fontSize: 'var(--caption-size)' }}>
                            Lote: {mov.batchNumber || mov.batchId}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal Registrar Salida de Insumos (solo disponible en modo mock) */}
      {ENV.USE_MOCK && (
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
      )}
      <WasteFormModal
        isOpen={isWasteOpen}
        onClose={() => setIsWasteOpen(false)}
        onSaved={reload}
      />
    </div>
  );
}
