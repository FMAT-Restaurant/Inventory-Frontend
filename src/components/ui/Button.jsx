/**
 * Componente Button según especificación FMAT-RESTAURANT v2.0
 * @param {'primary' | 'secondary' | 'tertiary' | 'destructive'} variant
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  className = '',
  style = {}
}) {
  const baseStyles = {
    fontFamily: 'inherit',
    fontWeight: 600,
    fontSize: size === 'sm' ? 'var(--small-size)' : 'var(--body-size)',
    borderRadius: 'var(--radius-control)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    height: size === 'sm' ? '32px' : size === 'lg' ? '48px' : 'var(--control-height)',
    padding: size === 'sm' ? '0 12px' : '0 16px',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.55 : 1,
    border: 'none',
    outline: 'none'
  };

  const variantStyles = {
    primary: {
      backgroundColor: 'var(--color-primary)',
      color: '#FFFFFF'
    },
    secondary: {
      backgroundColor: 'transparent',
      border: '1px solid var(--color-primary)',
      color: 'var(--color-primary)'
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: 'var(--color-text)'
    },
    destructive: {
      backgroundColor: 'var(--color-danger)',
      color: '#FFFFFF'
    }
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={className}
      style={{
        ...baseStyles,
        ...(variantStyles[variant] || variantStyles.primary),
        ...style
      }}
      onMouseEnter={e => {
        if (disabled) return;
        if (variant === 'primary') e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
        if (variant === 'secondary') e.currentTarget.style.backgroundColor = 'var(--color-primary-soft)';
        if (variant === 'tertiary') e.currentTarget.style.backgroundColor = '#F3F4F6';
        if (variant === 'destructive') e.currentTarget.style.backgroundColor = '#B91C1C';
      }}
      onMouseLeave={e => {
        if (disabled) return;
        const defaultBg = variantStyles[variant]?.backgroundColor || 'transparent';
        e.currentTarget.style.backgroundColor = defaultBg;
      }}
    >
      {children}
    </button>
  );
}
