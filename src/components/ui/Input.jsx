/**
 * Componente Input con etiqueta visible superior y mensaje de ayuda/error según FMAT v2.0
 */
export function Input({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  error = '',
  helperText = '',
  disabled = false,
  required = false,
  className = '',
  name,
  min,
  max,
  step
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 'var(--small-size)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={step}
        style={{
          height: 'var(--control-height)',
          padding: '0 12px',
          borderRadius: 'var(--radius-control)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
          fontSize: 'var(--body-size)',
          color: 'var(--color-text)',
          fontFamily: 'inherit',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          boxSizing: 'border-box'
        }}
        onFocus={e => {
          if (!error) {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-primary-soft)';
          }
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />

      {error ? (
        <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-danger)', fontWeight: 500 }}>
          {error}
        </span>
      ) : helperText ? (
        <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-muted)' }}>
          {helperText}
        </span>
      ) : null}
    </div>
  );
}

/**
 * Componente Select acorde al sistema FMAT v2.0
 */
export function Select({
  label,
  id,
  value,
  onChange,
  children,
  error = '',
  disabled = false,
  required = false,
  className = '',
  name
}) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label
          htmlFor={selectId}
          style={{
            fontSize: 'var(--small-size)',
            fontWeight: 600,
            color: 'var(--color-ink)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {label}
          {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
        </label>
      )}

      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        style={{
          height: 'var(--control-height)',
          padding: '0 12px',
          borderRadius: 'var(--radius-control)',
          border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
          backgroundColor: disabled ? '#F9FAFB' : '#FFFFFF',
          fontSize: 'var(--body-size)',
          color: 'var(--color-text)',
          fontFamily: 'inherit',
          outline: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        {children}
      </select>

      {error && (
        <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-danger)', fontWeight: 500 }}>
          {error}
        </span>
      )}
    </div>
  );
}
