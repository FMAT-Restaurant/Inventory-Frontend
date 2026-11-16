import { useEffect, useRef } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { Input, Select } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import {
  PAGE_SIZES,
  hasActiveFilters,
  useSupplierCostHistory,
} from '../hooks/useSupplierCostHistory';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function formatTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

const cell = { padding: '10px 12px', whiteSpace: 'nowrap' };
const headCell = {
  ...cell,
  position: 'sticky',
  top: 0,
  zIndex: 1,
  backgroundColor: 'var(--color-surface, #FFFFFF)',
  color: 'var(--color-muted)',
  fontSize: 'var(--caption-size)',
  textTransform: 'uppercase',
  borderBottom: '1px solid var(--color-border)',
};
const mutedText = { color: 'var(--color-muted)', fontSize: 'var(--small-size)' };

/**
 * Historial de costos de compra de un proveedor. Muestra primero la compra
 * más reciente y permite filtrar por insumo y fechas, cambiar el orden y
 * paginar. La tabla tiene su propio scroll con el encabezado fijo, así que
 * crecer a cientos de compras no desborda el modal.
 */
export function SupplierCostHistoryModal({ supplier, onClose }) {
  const {
    data,
    itemOptions,
    filters,
    page,
    loading,
    loaded,
    error,
    rangeError,
    updateFilters,
    clearFilters,
    goToPage,
  } = useSupplierCostHistory(supplier?.id);

  const scrollRef = useRef(null);

  // Al cambiar de página se vuelve al inicio de la tabla.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [page, filters]);

  const filtered = hasActiveFilters(filters);
  const first = data.total === 0 ? 0 : (data.page - 1) * data.limit + 1;
  const last = Math.min(data.page * data.limit, data.total);

  let body;
  if (!loaded && loading) {
    body = <p style={mutedText}>Cargando historial...</p>;
  } else if (error) {
    body = (
      <p style={{ ...mutedText, color: 'var(--color-danger)' }}>{error}</p>
    );
  } else if (rangeError) {
    body = (
      <p style={{ ...mutedText, color: 'var(--color-danger)' }}>{rangeError}</p>
    );
  } else if (data.total === 0) {
    body = (
      <p style={mutedText}>
        {filtered
          ? 'No hay compras que coincidan con los filtros.'
          : 'Este proveedor aún no tiene compras registradas.'}
      </p>
    );
  } else {
    body = (
      <div
        ref={scrollRef}
        style={{
          overflow: 'auto',
          // Deja espacio para filtros y pie sin pasarse de la pantalla
          maxHeight: 'clamp(160px, calc(100vh - 390px), 520px)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-control)',
          opacity: loading ? 0.55 : 1,
          transition: 'opacity 0.15s ease',
        }}
        aria-busy={loading}
      >
        <table
          style={{
            width: '100%',
            // En pantallas angostas la tabla se desplaza en horizontal dentro
            // de su contenedor en vez de aplastar las columnas
            minWidth: '560px',
            borderCollapse: 'separate',
            borderSpacing: 0,
            textAlign: 'left',
            fontSize: 'var(--small-size)',
          }}
        >
          <thead>
            <tr>
              <th style={headCell}>Fecha</th>
              <th style={headCell}>Insumo</th>
              <th style={headCell}>Lote</th>
              <th style={{ ...headCell, textAlign: 'right' }}>Cantidad</th>
              <th style={{ ...headCell, textAlign: 'right' }}>Costo unitario</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((entry) => (
              <tr key={entry.batchId}>
                <td style={{ ...cell, borderBottom: '1px solid var(--color-border)' }}>
                  {formatDate(entry.purchasedAt)}{' '}
                  <span style={{ ...mutedText, fontSize: 'var(--caption-size)' }}>
                    {formatTime(entry.purchasedAt)}
                  </span>
                </td>
                <td
                  style={{
                    ...cell,
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {entry.itemName}
                </td>
                <td style={{ ...cell, borderBottom: '1px solid var(--color-border)' }}>
                  {entry.batchNumber}
                </td>
                <td
                  style={{
                    ...cell,
                    textAlign: 'right',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  {entry.quantity} {entry.unit}
                </td>
                <td
                  style={{
                    ...cell,
                    textAlign: 'right',
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <strong>{formatMoney(entry.cost)}</strong>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <Modal
      isOpen={Boolean(supplier)}
      onClose={onClose}
      title={supplier ? `Historial de costos · ${supplier.name}` : ''}
      maxWidth="900px"
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          alignItems: 'end',
        }}
      >
        <Select
          id="cost-history-item"
          label="Insumo"
          value={filters.itemId}
          onChange={(e) => updateFilters({ itemId: e.target.value })}
        >
          <option value="">Todos los insumos</option>
          {itemOptions.map((option) => (
            <option key={option.itemId} value={option.itemId}>
              {option.itemName}
            </option>
          ))}
        </Select>
        <Input
          id="cost-history-from"
          label="Desde"
          type="date"
          value={filters.from}
          max={filters.to || undefined}
          onChange={(e) => updateFilters({ from: e.target.value })}
        />
        <Input
          id="cost-history-to"
          label="Hasta"
          type="date"
          value={filters.to}
          min={filters.from || undefined}
          onChange={(e) => updateFilters({ to: e.target.value })}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          minHeight: '32px',
        }}
      >
        <span style={mutedText}>
          {data.total > 0 && !rangeError
            ? `Mostrando ${first}–${last} de ${data.total} compra${data.total === 1 ? '' : 's'}`
            : ''}
        </span>
        {filtered && (
          <Button variant="tertiary" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {body}

      {data.total > 0 && !rangeError && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <label
            style={{
              ...mutedText,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            Por página
            <select
              value={filters.limit}
              onChange={(e) => updateFilters({ limit: Number(e.target.value) })}
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
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onChange={goToPage}
            disabled={loading}
          />
        </div>
      )}
    </Modal>
  );
}
