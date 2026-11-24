import { PaginationBar } from './PaginationBar.jsx';

/**
 * Estados compartidos por las vistas paginadas:
 *  - cargando sin datos -> `loadingState` (o `emptyState` si no se indica)
 *  - catálogo vacío    -> `emptyState`
 *  - página sin coincidencias por filtros locales -> aviso + barra
 *  - con resultados    -> `children` + `PaginationBar`
 *
 * La barra recibe `{...pagination}` del hook `usePagination`.
 */
export function PaginatedSection({
  loading,
  total,
  filteredCount,
  emptyState,
  loadingState = null,
  noMatchesMessage,
  pagination,
  paginationDisabled = false,
  paginationLabel = 'resultados',
  gap = '20px',
  children,
}) {
  if (loading && filteredCount === 0) {
    return loadingState ?? emptyState;
  }

  if (total === 0) {
    return emptyState;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap }}>
      {filteredCount === 0 ? (
        <div
          style={{
            padding: '24px',
            textAlign: 'center',
            color: 'var(--color-muted)',
            fontSize: 'var(--small-size)',
          }}
        >
          {noMatchesMessage}
        </div>
      ) : (
        children
      )}

      <PaginationBar
        {...pagination}
        disabled={paginationDisabled}
        label={paginationLabel}
      />
    </div>
  );
}
