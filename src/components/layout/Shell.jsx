import { useInventory } from '../../context/InventoryContext.jsx';
import { BoxIcon, BookOpenIcon, ClipboardListIcon } from '../ui/Icons.jsx';

/**
 * Shell Layout según FMAT-RESTAURANT v2.0
 * Regla 70/20/10, Sidebar fija a la izquierda (Desktop/Tablet) y BottomNav en Mobile.
 */
export function Shell({ activeTab, onTabChange, children, pageTitle, primaryAction }) {
  const { cargando, notificacion } = useInventory();

  const navItems = [
    { id: 'insumos', label: 'Insumos y Lotes', icon: BoxIcon },
    { id: 'recetas', label: 'Catálogo y Recetas', icon: BookOpenIcon },
    { id: 'movimientos', label: 'Movimientos de Almacén', icon: ClipboardListIcon }
  ];

  return (
    <div className="app-shell">
      {/* Sidebar Desktop / Tablet */}
      <aside className="app-sidebar">
        {/* Brand / Logo */}
        <div
          style={{
            height: '72px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '0 20px',
            borderBottom: '1px solid var(--color-border)'
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px',
              flexShrink: 0
            }}
          >
            F
          </div>
          <div className="sidebar-brand-title" style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--color-ink)' }}>FMAT</span>
            <span style={{ fontSize: '11px', color: 'var(--color-muted)', fontWeight: 500 }}>Inventario</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-control)',
                  border: 'none',
                  background: isActive ? 'var(--color-primary-soft)' : 'transparent',
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 'var(--small-size)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease, color 0.15s ease',
                  width: '100%'
                }}
              >
                <Icon size={18} color={isActive ? 'var(--color-primary)' : 'var(--color-muted)'} />
                <span className="nav-label">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Container */}
      <div className="app-main">
        {/* Header */}
        <header className="app-header">
          <div>
            <h1>{pageTitle}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {cargando && (
              <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-primary)', fontWeight: 600 }}>
                Actualizando existencias...
              </span>
            )}
            {primaryAction}
          </div>
        </header>

        {/* Notification Toast */}
        {notificacion && (
          <div
            style={{
              margin: '16px 32px 0',
              padding: '12px 16px',
              borderRadius: 'var(--radius-control)',
              backgroundColor:
                notificacion.tipo === 'success'
                  ? 'var(--bg-success)'
                  : notificacion.tipo === 'warning'
                  ? 'var(--bg-warning)'
                  : notificacion.tipo === 'error'
                  ? 'var(--bg-danger)'
                  : '#EFF6FF',
              color:
                notificacion.tipo === 'success'
                  ? 'var(--color-success)'
                  : notificacion.tipo === 'warning'
                  ? 'var(--color-warning)'
                  : notificacion.tipo === 'error'
                  ? 'var(--color-danger)'
                  : '#1D4ED8',
              fontSize: 'var(--small-size)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: 'var(--shadow-flat)'
            }}
          >
            <span>{notificacion.texto}</span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="app-content">{children}</main>
      </div>

      {/* Bottom Navigation (Mobile < 768px) */}
      <nav className="app-bottom-nav">
        {navItems.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                border: 'none',
                background: 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: isActive ? 600 : 400
              }}
            >
              <Icon size={18} color={isActive ? 'var(--color-primary)' : 'var(--color-muted)'} />
              <span>{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
