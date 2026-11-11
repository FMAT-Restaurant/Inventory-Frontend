import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { BoxIcon, BookOpenIcon, ClipboardListIcon, ArrowRightIcon, PackageIcon, TruckIcon } from '../../components/ui/Icons.jsx';
import { useAuth } from '../../context/AuthContext';
import { MODULE_READ_PERMISSION } from '../../config/permissions';
/**
 * Menú Inicial según FMAT-RESTAURANT v2.0
 * Vista estandarizada con tarjetas grandes para Insumos, Recetas y Movimientos.
 * Las tarjetas se ocultan si el usuario no tiene el permiso de lectura del módulo.
 */
export function MainMenu({ onSelectModule }) {
  const { can } = useAuth();
  const modules = [
    {
      id: 'items',
      title: 'Catálogo de Insumos',
      icon: PackageIcon
    },
    {
      id: 'batches',
      title: 'Lotes',
      icon: BoxIcon
    },
    {
      id: 'proveedores',
      title: 'Proveedores',
      icon: TruckIcon
    },
    {
      id: 'recetas',
      title: 'Catálogo y Recetas',
      icon: BookOpenIcon
    },
    {
      id: 'movimientos',
      title: 'Movimientos de Almacén',
      icon: ClipboardListIcon
    }
  ].filter(mod => can(MODULE_READ_PERMISSION[mod.id]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <p style={{ fontSize: 'var(--small-size)', color: 'var(--color-muted)' }}>
          Selecciona una sección para gestionar las existencias, recetas y operaciones de almacén.
        </p>
      </div>

      {/* Grid estándar idéntico al resto de las páginas */}
      {modules.length === 0 ? (
        <Card padding="32px">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              color: 'var(--color-muted)'
            }}
          >
            <p style={{ fontSize: 'var(--small-size)' }}>
              No tienes permisos para acceder a ningún módulo de inventario.
            </p>
          </div>
        </Card>
      ) : (
      <div className="grid-responsive">
        {modules.map(mod => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.id}
              padding="28px"
              hoverable
              onClick={() => onSelectModule(mod.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '24px',
                minHeight: '290px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Contenedor de Icono Minimalista FMAT v2.0 */}
                <div
                  style={{
                    height: '160px',
                    borderRadius: 'var(--radius-control)',
                    backgroundColor: 'var(--color-primary-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-primary)'
                  }}
                >
                  <Icon size={48} color="var(--color-primary)" />
                </div>

                {/* Título claro y centrado */}
                <h2
                  style={{
                    fontSize: 'var(--h2-size)',
                    fontWeight: 700,
                    color: 'var(--color-ink)',
                    textAlign: 'center',
                    margin: 0
                  }}
                >
                  {mod.title}
                </h2>
              </div>

              {/* Botón de acción Ingresar */}
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={e => {
                  e.stopPropagation();
                  onSelectModule(mod.id);
                }}
              >
                <span>Ingresar</span>
                <ArrowRightIcon size={18} />
              </Button>
            </Card>
          );
        })}
      </div>
      )}
    </div>
  );
}
