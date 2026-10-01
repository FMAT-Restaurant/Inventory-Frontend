import { useState } from 'react';
import { useInventory } from '../context/InventoryContext.jsx';
import { Card } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Input, Select } from '../components/ui/Input.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { SearchIcon, PlusIcon, ChevronDownIcon } from '../components/ui/Icons.jsx';
import { EstadoLote, EstadoUmbral } from '../services/inventory/types.js';

export function InsumosPage({ preselectedIngredientId }) {
  const { ingredientes, lotes, proveedores, registrarCompra, cargando } = useInventory();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');
  const [lotesExpandidos, setLotesExpandidos] = useState({});

  // Estado del formulario de compra a proveedor
  const [formularioCompra, setFormularioCompra] = useState({
    providerId: proveedores[0]?.id || '',
    ingredientId: preselectedIngredientId || ingredientes[0]?.id || '',
    cantidad: '',
    costoUnitario: '',
    fechaCaducidad: ''
  });

  const toggleExpandirLotes = id => {
    setLotesExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAbrirModal = (ingId = null) => {
    setFormularioCompra({
      providerId: proveedores[0]?.id || '',
      ingredientId: ingId || preselectedIngredientId || ingredientes[0]?.id || '',
      cantidad: '',
      costoUnitario: '',
      fechaCaducidad: ''
    });
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    setIsModalOpen(false);
  };

  const handleGuardarCompra = async e => {
    e.preventDefault();
    if (!formularioCompra.cantidad || !formularioCompra.costoUnitario || !formularioCompra.fechaCaducidad) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    try {
      await registrarCompra({
        providerId: formularioCompra.providerId,
        itemsComprados: [
          {
            ingredientId: formularioCompra.ingredientId,
            cantidad: Number(formularioCompra.cantidad),
            costoUnitario: Number(formularioCompra.costoUnitario),
            fechaCaducidad: formularioCompra.fechaCaducidad
          }
        ]
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado de ingredientes
  const ingredientesFiltrados = ingredientes.filter(ing => {
    const coincideBusqueda =
      ing.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ing.categoria.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;
    if (filtroEstado === 'TODOS') return true;
    return ing.estadoUmbral === filtroEstado;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Barra de Filtros y Búsqueda */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ width: '320px', maxWidth: '100%', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-muted)',
              display: 'flex',
              alignItems: 'center',
              pointerEvents: 'none'
            }}
          >
            <SearchIcon size={16} />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre o categoría..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{
              width: '100%',
              height: 'var(--control-height)',
              paddingLeft: '38px',
              paddingRight: '12px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              fontSize: 'var(--body-size)',
              color: 'var(--color-text)',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-muted)', fontWeight: 600 }}>
            Filtrar:
          </span>
          {['TODOS', EstadoUmbral.OPTIMO, EstadoUmbral.BAJO, EstadoUmbral.CRITICO].map(estado => (
            <button
              key={estado}
              type="button"
              onClick={() => setFiltroEstado(estado)}
              style={{
                height: '32px',
                padding: '0 12px',
                borderRadius: 'var(--radius-control)',
                border: `1px solid ${filtroEstado === estado ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: filtroEstado === estado ? 'var(--color-primary-soft)' : '#FFFFFF',
                color: filtroEstado === estado ? 'var(--color-primary)' : 'var(--color-text)',
                fontSize: 'var(--caption-size)',
                fontWeight: filtroEstado === estado ? 600 : 500,
                cursor: 'pointer'
              }}
            >
              {estado === 'TODOS' ? 'Todos' : estado === EstadoUmbral.OPTIMO ? 'Óptimo' : estado === EstadoUmbral.BAJO ? 'Bajo' : 'Agotado'}
            </button>
          ))}
          <Button variant="primary" size="md" onClick={() => handleAbrirModal()}>
            <PlusIcon size={16} />
            <span>Registrar compra</span>
          </Button>
        </div>
      </div>

      {/* Lista de Insumos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {ingredientesFiltrados.map(ing => {
          const lotesIngrediente = lotes
            .filter(l => l.ingredientId === ing.id)
            .sort((a, b) => new Date(a.fechaCaducidad) - new Date(b.fechaCaducidad));

          const estanLotesAbiertos = lotesExpandidos[ing.id];

          return (
            <Card key={ing.id} padding="20px">
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: 'var(--h3-size)' }}>{ing.nombre}</h3>
                    <span
                      style={{
                        fontSize: 'var(--caption-size)',
                        backgroundColor: '#F3F4F6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: 'var(--color-muted)'
                      }}
                    >
                      {ing.categoria}
                    </span>
                    <Badge
                      variant={
                        ing.estadoUmbral === EstadoUmbral.CRITICO
                          ? 'danger'
                          : ing.estadoUmbral === EstadoUmbral.BAJO
                          ? 'warning'
                          : 'success'
                      }
                    >
                      {ing.estadoUmbral === EstadoUmbral.CRITICO
                        ? 'Agotado'
                        : ing.estadoUmbral === EstadoUmbral.BAJO
                        ? 'Bajo'
                        : 'Óptimo'}
                    </Badge>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: '24px',
                      marginTop: '10px',
                      flexWrap: 'wrap',
                      fontSize: 'var(--small-size)'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--color-muted)' }}>Existencia Disponible: </span>
                      <strong style={{ color: 'var(--color-ink)', fontSize: '15px' }}>
                        {ing.existenciaDisponible} {ing.unidad}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)' }}>Comprometido: </span>
                      <strong style={{ color: ing.stockReservado > 0 ? 'var(--color-primary)' : 'var(--color-muted)' }}>
                        {ing.stockReservado} {ing.unidad}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)' }}>Stock Total: </span>
                      <strong>
                        {ing.existenciaTotal} {ing.unidad}
                      </strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => toggleExpandirLotes(ing.id)}
                  >
                    <span>Lotes ({lotesIngrediente.length})</span>
                    <ChevronDownIcon
                      size={14}
                      style={{
                        transform: estanLotesAbiertos ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.15s ease'
                      }}
                    />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAbrirModal(ing.id)}
                  >
                    + Comprar
                  </Button>
                </div>
              </div>

              {/* Desglose de Lotes */}
              {estanLotesAbiertos && (
                <div
                  style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-canvas)',
                    padding: '16px',
                    borderRadius: 'var(--radius-control)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: 'var(--caption-size)', fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase' }}>
                      Lotes registrados (ordenados por fecha de vencimiento)
                    </span>
                  </div>

                  {lotesIngrediente.length === 0 ? (
                    <p style={{ fontSize: 'var(--small-size)', color: 'var(--color-muted)' }}>No hay lotes registrados.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {lotesIngrediente.map((lote, index) => {
                        const esPrioridad = index === 0 && lote.estado === EstadoLote.ACTIVO && lote.cantidadActual > 0;
                        return (
                          <div
                            key={lote.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              backgroundColor: esPrioridad ? '#FFFFFF' : '#F9FAFB',
                              border: `1px solid ${esPrioridad ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              borderRadius: 'var(--radius-control)',
                              fontSize: 'var(--small-size)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <strong style={{ color: 'var(--color-ink)' }}>{lote.id}</strong>
                              <span>
                                Vence: <strong style={{ color: 'var(--color-ink)' }}>{lote.fechaCaducidad}</strong>
                              </span>
                              <span style={{ color: 'var(--color-muted)' }}>
                                Ingreso: {lote.fechaIngreso}
                              </span>
                              <span style={{ color: 'var(--color-muted)' }}>
                                Costo: ${lote.costoUnitario.toFixed(2)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <span>
                                Cantidad: <strong>{lote.cantidadActual}</strong> / {lote.cantidadInicial} {ing.unidad}
                              </span>
                              <Badge
                                variant={
                                  lote.estado === EstadoLote.CADUCADO
                                    ? 'danger'
                                    : lote.estado === EstadoLote.AGOTADO
                                    ? 'neutral'
                                    : 'success'
                                }
                              >
                                {lote.estado}
                              </Badge>
                              {esPrioridad && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    color: 'var(--color-primary)',
                                    backgroundColor: 'var(--color-primary-soft)',
                                    padding: '2px 8px',
                                    borderRadius: '4px'
                                  }}
                                >
                                  Prioridad de uso
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal Registrar Compra */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCerrarModal}
        title="Registrar Compra a Proveedor"
      >
        <form onSubmit={handleGuardarCompra} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Select
            label="Proveedor"
            value={formularioCompra.providerId}
            onChange={e => setFormularioCompra({ ...formularioCompra, providerId: e.target.value })}
            required
          >
            {proveedores.map(prov => (
              <option key={prov.id} value={prov.id}>
                {prov.nombre}
              </option>
            ))}
          </Select>

          <Select
            label="Insumo a reabastecer"
            value={formularioCompra.ingredientId}
            onChange={e => setFormularioCompra({ ...formularioCompra, ingredientId: e.target.value })}
            required
          >
            {ingredientes.map(ing => (
              <option key={ing.id} value={ing.id}>
                {ing.nombre} ({ing.unidad})
              </option>
            ))}
          </Select>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Cantidad comprada"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="Ej. 10.5"
              value={formularioCompra.cantidad}
              onChange={e => setFormularioCompra({ ...formularioCompra, cantidad: e.target.value })}
              required
            />
            <Input
              label="Costo unitario ($)"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 45.00"
              value={formularioCompra.costoUnitario}
              onChange={e => setFormularioCompra({ ...formularioCompra, costoUnitario: e.target.value })}
              required
            />
          </div>

          <Input
            label="Fecha de caducidad"
            type="date"
            value={formularioCompra.fechaCaducidad}
            onChange={e => setFormularioCompra({ ...formularioCompra, fechaCaducidad: e.target.value })}
            required
            helperText="Se generará un lote identificado con esta fecha de caducidad."
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="tertiary" onClick={handleCerrarModal} disabled={cargando}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar compra'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
