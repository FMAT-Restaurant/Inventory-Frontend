/**
 * Componente Badge (Pill con indicador circular dot) según FMAT-RESTAURANT v2.0
 * @param {string} variant - 'success' | 'warning' | 'danger' | 'neutral'
 * @param {React.ReactNode} children - Texto o contenido del badge
 */
export function Badge({ variant = 'neutral', children, className = '' }) {
  const styles = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 10px',
    borderRadius: 'var(--radius-pill)',
    fontSize: 'var(--caption-size)',
    lineHeight: 'var(--caption-line)',
    fontWeight: 600,
    width: 'fit-content'
  };

  const variants = {
    success: {
      backgroundColor: 'var(--bg-success)',
      color: 'var(--color-success)',
      dotColor: 'var(--color-success)'
    },
    warning: {
      backgroundColor: 'var(--bg-warning)',
      color: 'var(--color-warning)',
      dotColor: 'var(--color-warning)'
    },
    danger: {
      backgroundColor: 'var(--bg-danger)',
      color: 'var(--color-danger)',
      dotColor: 'var(--color-danger)'
    },
    neutral: {
      backgroundColor: '#F3F4F6',
      color: 'var(--color-text)',
      dotColor: 'var(--color-muted)'
    }
  };

  const currentVariant = variants[variant] || variants.neutral;

  return (
    <span
      className={className}
      style={{
        ...styles,
        backgroundColor: currentVariant.backgroundColor,
        color: currentVariant.color
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: currentVariant.dotColor,
          display: 'inline-block'
        }}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}
