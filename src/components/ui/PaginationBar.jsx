import { Pagination } from './Pagination.jsx';

const DEFAULT_PAGE_SIZES = [10, 20, 25, 50, 100];

/**
 * Selector de "por página" reutilizable. Su valor controla el `limit`
 * enviado al backend.
 */
export function PageSizeSelect({
  value,
  onChange,
  options = DEFAULT_PAGE_SIZES,
  disabled = false,
}) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: 'var(--small-size)',
        color: 'var(--color-muted)',
      }}
    >
      <span>Por página</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        disabled={disabled}
        style={{
          height: '32px',
          padding: '0 8px',
          borderRadius: 'var(--radius-control)',
          border: '1px solid var(--color-border)',
          backgroundColor: '#FFFFFF',
          fontFamily: 'inherit',
          color: 'var(--color-text)',
        }}
      >
        {options.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Barra inferior con contador de resultados, selector de tamaño de página
 * y paginador numerado. Se reutiliza en todas las vistas paginadas.
 */
export function PaginationBar({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  disabled = false,
  label = 'resultados',
  showPageSize = true,
  pageSizeOptions = DEFAULT_PAGE_SIZES,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
        paddingTop: '8px',
      }}
    >
      <span
        style={{
          fontSize: 'var(--small-size)',
          color: 'var(--color-muted)',
        }}
      >
        {total} {label}
      </span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {showPageSize && onLimitChange ? (
          <PageSizeSelect
            value={limit}
            onChange={onLimitChange}
            options={pageSizeOptions}
            disabled={disabled}
          />
        ) : null}
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={onPageChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
