/**
 * Componente Card contenedor según FMAT-RESTAURANT v2.0
 */
export function Card({
  children,
  className = '',
  style = {},
  padding = '20px',
  onClick,
  hoverable = false
}) {
  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-card)',
        padding,
        boxShadow: 'var(--shadow-flat)',
        transition: hoverable ? 'transform 0.15s ease, box-shadow 0.15s ease' : 'none',
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        ...style
      }}
      onMouseEnter={e => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.08)';
        }
      }}
      onMouseLeave={e => {
        if (hoverable) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-flat)';
        }
      }}
    >
      {children}
    </div>
  );
}
