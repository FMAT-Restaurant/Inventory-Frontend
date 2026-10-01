import { useState } from 'react';
import { useInventory } from '../context/InventoryContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { UtensilsIcon } from '../components/ui/Icons.jsx';

export function RecetasPage() {
  const { platillos, ingredientes } = useInventory();
  const [platilloSeleccionado, setPlatilloSeleccionado] = useState(null);

  const handleVerDetalles = platillo => {
    setPlatilloSeleccionado(platillo);
  };

  const handleCerrarModal = () => {
    setPlatilloSeleccionado(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <p style={{ fontSize: 'var(--small-size)', color: 'var(--color-muted)' }}>
          Estimación de porciones disponibles calculada a partir de las existencias actuales de ingredientes.
        </p>
      </div>

      {/* Grid de Cards de Platillos según FMAT v2.0 */}
      <div className="grid-responsive">
        {platillos.map(platillo => {
          return (
            <Card
              key={platillo.plateId}
              padding="16px"
              hoverable
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '16px'
              }}
            >
              <div>
                {/* Contenedor de Imagen Minimalista FMAT v2.0 */}
                <div
                  style={{
                    height: '120px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--color-primary-soft)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '14px',
                    color: 'var(--color-primary)',
                    gap: '8px'
                  }}
                >
                  <UtensilsIcon size={26} color="var(--color-primary)" />
                  <span style={{ fontSize: 'var(--caption-size)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {platillo.categoria}
                  </span>
                </div>

                {/* Badge de Disponibilidad */}
                <div style={{ marginBottom: '8px' }}>
                  <Badge variant={platillo.disponible ? 'success' : 'danger'}>
                    {platillo.disponible ? 'Disponible' : 'Agotado'}
                  </Badge>
                </div>

                {/* Título y Descripción */}
                <h3 style={{ fontSize: 'var(--h3-size)', marginBottom: '6px' }}>{platillo.nombre}</h3>
                <p
                  style={{
                    fontSize: 'var(--caption-size)',
                    color: 'var(--color-muted)',
                    lineHeight: '18px',
                    marginBottom: '14px'
                  }}
                >
                  {platillo.descripcion}
                </p>

                {/* Porciones Disponibles */}
                <div style={{ fontSize: 'var(--small-size)', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--color-muted)' }}>Porciones disponibles: </span>
                  <strong
                    style={{
                      color: platillo.unidadesPreparables > 0 ? 'var(--color-ink)' : 'var(--color-danger)'
                    }}
                  >
                    {platillo.unidadesPreparables} {platillo.unidadesPreparables === 1 ? 'porción' : 'porciones'}
                  </strong>
                </div>

                {platillo.faltantes.length > 0 && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--color-danger)',
                      backgroundColor: 'var(--bg-danger)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      marginBottom: '10px'
                    }}
                  >
                    Insumos agotados: {platillo.faltantes.map(f => f.nombre).join(', ')}
                  </div>
                )}
              </div>

              {/* Botón de Acción */}
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  fullWidth
                  onClick={() => handleVerDetalles(platillo)}
                >
                  Ver receta
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal Detalle de Receta */}
      <Modal
        isOpen={Boolean(platilloSeleccionado)}
        onClose={handleCerrarModal}
        title={platilloSeleccionado ? `Receta: ${platilloSeleccionado.nombre}` : ''}
        maxWidth="600px"
      >
        {platilloSeleccionado && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: 'var(--small-size)', color: 'var(--color-muted)' }}>
              Insumos requeridos por porción y disponibilidad en almacén:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {platilloSeleccionado.ingredientesDetalle.map(item => {
                const ingCompleto = ingredientes.find(i => i.id === item.ingredientId);
                const suficiente = item.disponible >= item.cantidadRequerida;

                return (
                  <div
                    key={item.ingredientId}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-control)',
                      border: `1px solid ${suficiente ? 'var(--color-border)' : 'var(--color-danger)'}`,
                      backgroundColor: suficiente ? '#FFFFFF' : 'var(--bg-danger)'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--color-ink)' }}>{item.nombre}</strong>
                      <div style={{ fontSize: 'var(--caption-size)', color: 'var(--color-muted)', marginTop: '2px' }}>
                        Requerido: <strong>{item.cantidadRequerida} {ingCompleto?.unidad}</strong> | En almacén:{' '}
                        <strong>{item.disponible} {ingCompleto?.unidad}</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <Badge variant={suficiente ? 'success' : 'danger'}>
                        {suficiente ? `${item.porcionesPosibles} porciones max` : 'Insuficiente'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <Button variant="primary" onClick={handleCerrarModal}>
                Cerrar detalle
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
