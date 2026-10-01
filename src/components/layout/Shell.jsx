import { useInventory } from '../../context/InventoryContext.jsx';
import { ArrowLeftIcon } from '../ui/Icons.jsx';

/**
 * Shell Layout según FMAT-RESTAURANT v2.0
 * Layout de ancho completo estandarizado para todas las vistas (Menú y Módulos).
 */
export function Shell({ onBackToMenu, children, pageTitle, primaryAction }) {
  const { cargando, notificacion } = useInventory();

  return (
    <div className="app-shell">
      {/* Main Container a Ancho Completo */}
      <div className="app-main">
        {/* Header Superior Estandarizado */}
        <header className="app-header">
          <div className="app-header-left">
            {onBackToMenu ? (
              <>
                <button
                  type="button"
                  onClick={onBackToMenu}
                  className="btn-back-menu"
                  title="Regresar al menú principal"
                >
                  <ArrowLeftIcon size={18} />
                  <span>Volver al Menú</span>
                </button>
                <div className="header-divider" />
                <h1 className="header-page-title">{pageTitle}</h1>
              </>
            ) : (
              <>
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
                <h1 className="header-page-title">{pageTitle}</h1>
              </>
            )}
          </div>

          <div className="app-header-right">
            {cargando && (
              <span className="header-loading-text">
                Actualizando existencias...
              </span>
            )}
            {primaryAction}
          </div>
        </header>

        {/* Notification Toast */}
        {notificacion && (
          <div
            className="app-notification-toast"
            style={{
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
                  : '#1D4ED8'
            }}
          >
            <span>{notificacion.texto}</span>
          </div>
        )}

        {/* Dynamic Page Content */}
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
