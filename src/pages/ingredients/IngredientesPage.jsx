import { useState } from 'react';
import { useInventory } from '../../context/InventoryContext.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input, Select } from '../../components/ui/Input.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { SearchIcon, PlusIcon, PackageIcon } from '../../components/ui/Icons.jsx';
import { EstadoUmbral } from '../../services/inventory/types.js';

const UNIDADES = ['kg', 'g', 'l', 'ml', 'pza', 'caja', 'paquete'];

const formularioVacio = proveedores => ({
  id: '',
  nombre: '',
  categoria: '',
  unidad: 'kg',
  minimo: '',
  costoPromedio: '',
  providerIdSugerido: proveedores[0]?.id || ''
});

const badgeVariant = estado =>
  estado === EstadoUmbral.CRITICO ? 'danger' : estado === EstadoUmbral.BAJO ? 'warning' : 'success';

const estadoLabel = estado =>
  estado === EstadoUmbral.CRITICO ? 'Agotado' : estado === EstadoUmbral.BAJO ? 'Bajo' : 'Óptimo';

export function IngredientesPage() {
  const { ingredientes, proveedores, guardarIngrediente, eliminarIngrediente, cargando } = useInventory();

  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODAS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formulario, setFormulario] = useState(formularioVacio(proveedores));
  const [errorFormulario, setErrorFormulario] = useState('');

  const categorias = [
    'TODAS',
    ...Array.from(new Set(ingredientes.map(i => i.categoria))).sort((a, b) =>
      a.localeCompare(b, 'es', { sensitivity: 'base' })
    )
  ];

  const ingredientesFiltrados = ingredientes.filter(ing => {
    const coincideBusqueda =
      ing.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      ing.categoria.toLowerCase().includes(busqueda.toLowerCase());

    if (!coincideBusqueda) return false;
    if (filtroCategoria === 'TODAS') return true;
    return ing.categoria === filtroCategoria;
  });

  const handleAbrirCrear = () => {
    setFormulario(formularioVacio(proveedores));
    setErrorFormulario('');
    setIsModalOpen(true);
  };

  const handleAbrirEditar = ing => {
    setFormulario({
      id: ing.id,
      nombre: ing.nombre,
      categoria: ing.categoria,
      unidad: ing.unidad,
      minimo: String(ing.minimo),
      costoPromedio: String(ing.costoPromedio),
      providerIdSugerido: ing.providerIdSugerido || proveedores[0]?.id || ''
    });
    setErrorFormulario('');
    setIsModalOpen(true);
  };

  const handleCerrarModal = () => {
    if (!cargando) setIsModalOpen(false);
  };

  const handleGuardar = async e => {
    e.preventDefault();

    if (!formulario.nombre.trim()) {
      setErrorFormulario('El nombre del ingrediente es obligatorio.');
      return;
    }
    if (!formulario.unidad) {
      setErrorFormulario('Selecciona una unidad de medida.');
      return;
    }
    if (formulario.minimo === '' || Number(formulario.minimo) < 0) {
      setErrorFormulario('El umbral mínimo debe ser 0 o mayor.');
      return;
    }

    try {
      await guardarIngrediente({
        id: formulario.id || undefined,
        nombre: formulario.nombre,
        categoria: formulario.categoria,
        unidad: formulario.unidad,
        minimo: Number(formulario.minimo),
        costoPromedio: Number(formulario.costoPromedio) || 0,
        providerIdSugerido: formulario.providerIdSugerido
      });
      setIsModalOpen(false);
    } catch (err) {
      setErrorFormulario(err.message);
    }
  };

  const handleEliminar = async ing => {
    if (!window.confirm(`¿Eliminar el ingrediente "${ing.nombre}" del catálogo?`)) return;
    try {
      await eliminarIngrediente(ing.id);
    } catch (err) {
      console.error(err);
    }
  };

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
            Categoría:
          </span>
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            style={{
              height: '32px',
              padding: '0 12px',
              borderRadius: 'var(--radius-control)',
              border: '1px solid var(--color-border)',
              backgroundColor: '#FFFFFF',
              fontSize: 'var(--caption-size)',
              color: 'var(--color-text)',
              fontFamily: 'inherit',
              cursor: 'pointer'
            }}
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'TODAS' ? 'Todas' : cat}
              </option>
            ))}
          </select>
          <Button variant="primary" size="md" onClick={handleAbrirCrear}>
            <PlusIcon size={16} />
            <span>Nuevo ingrediente</span>
          </Button>
        </div>
      </div>

      {/* Grid de Ingredientes */}
      {ingredientesFiltrados.length === 0 ? (
        <Card padding="32px">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--color-muted)' }}>
            <PackageIcon size={32} />
            <p style={{ fontSize: 'var(--small-size)' }}>No se encontraron ingredientes con esos criterios.</p>
          </div>
        </Card>
      ) : (
        <div className="grid-responsive">
          {ingredientesFiltrados.map(ing => {
            const proveedor = ing.proveedorSugerido || proveedores.find(p => p.id === ing.providerIdSugerido);
            return (
              <Card
                key={ing.id}
                padding="20px"
                hoverable
                style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '16px' }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <h3 style={{ fontSize: 'var(--h3-size)' }}>{ing.nombre}</h3>
                    <Badge variant={badgeVariant(ing.estadoUmbral)}>{estadoLabel(ing.estadoUmbral)}</Badge>
                  </div>

                  <div style={{ marginTop: '8px' }}>
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
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginTop: '16px',
                      fontSize: 'var(--small-size)'
                    }}
                  >
                    <div>
                      <span style={{ color: 'var(--color-muted)' }}>Disponible: </span>
                      <strong style={{ color: 'var(--color-ink)' }}>
                        {ing.existenciaDisponible} {ing.unidad}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)' }}>Stock total: </span>
                      <strong>
                        {ing.existenciaTotal} {ing.unidad}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)' }}>Mínimo: </span>
                      <strong>
                        {ing.minimo} {ing.unidad}
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-muted)' }}>Costo prom.: </span>
                      <strong>${Number(ing.costoPromedio).toFixed(2)}</strong>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: 'var(--caption-size)', color: 'var(--color-muted)' }}>
                    Proveedor sugerido: <strong style={{ color: 'var(--color-text)' }}>{proveedor?.nombre || 'Sin asignar'}</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <Button variant="tertiary" size="sm" onClick={() => handleEliminar(ing)} disabled={cargando}>
                    Eliminar
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleAbrirEditar(ing)} disabled={cargando}>
                    Editar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Ingrediente */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCerrarModal}
        title={formulario.id ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
      >
        <form onSubmit={handleGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input
            label="Nombre"
            placeholder="Ej. Harina de Trigo Extra"
            value={formulario.nombre}
            onChange={e => setFormulario({ ...formulario, nombre: e.target.value })}
            required
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Categoría"
              placeholder="Ej. Abarrotes"
              value={formulario.categoria}
              onChange={e => setFormulario({ ...formulario, categoria: e.target.value })}
              helperText="Opcional. Por defecto: General."
            />
            <Select
              label="Unidad de medida"
              value={formulario.unidad}
              onChange={e => setFormulario({ ...formulario, unidad: e.target.value })}
              required
            >
              {UNIDADES.map(unidad => (
                <option key={unidad} value={unidad}>
                  {unidad}
                </option>
              ))}
            </Select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Input
              label="Umbral mínimo"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 10"
              value={formulario.minimo}
              onChange={e => setFormulario({ ...formulario, minimo: e.target.value })}
              required
            />
            <Input
              label="Costo promedio ($)"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ej. 18.50"
              value={formulario.costoPromedio}
              onChange={e => setFormulario({ ...formulario, costoPromedio: e.target.value })}
            />
          </div>

          <Select
            label="Proveedor sugerido"
            value={formulario.providerIdSugerido}
            onChange={e => setFormulario({ ...formulario, providerIdSugerido: e.target.value })}
          >
            <option value="">Sin asignar</option>
            {proveedores.map(prov => (
              <option key={prov.id} value={prov.id}>
                {prov.nombre}
              </option>
            ))}
          </Select>

          {errorFormulario && (
            <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-danger)', fontWeight: 500 }}>
              {errorFormulario}
            </span>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <Button variant="tertiary" onClick={handleCerrarModal} disabled={cargando}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={cargando}>
              {cargando ? 'Guardando...' : formulario.id ? 'Guardar cambios' : 'Agregar ingrediente'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}