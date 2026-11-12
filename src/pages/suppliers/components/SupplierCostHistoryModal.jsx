import { useEffect, useState } from 'react';
import { Modal } from '../../../components/ui/Modal.jsx';
import { suppliersRepository } from '../../../services/suppliers';

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function formatMoney(value) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

/**
 * Historial de costos de compra de un proveedor: cada lote comprado con su
 * costo unitario original, del más antiguo al más reciente.
 */
export function SupplierCostHistoryModal({ supplier, onClose }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!supplier) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setEntries([]);
    suppliersRepository
      .costHistory(supplier.id)
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err?.message || 'No se pudo cargar el historial de costos.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supplier]);

  const cell = { padding: '10px 12px', whiteSpace: 'nowrap' };
  const message = { color: 'var(--color-muted)', fontSize: 'var(--small-size)' };

  let content;
  if (loading) {
    content = <p style={message}>Cargando historial...</p>;
  } else if (error) {
    content = (
      <p style={{ ...message, color: 'var(--color-danger)' }}>{error}</p>
    );
  } else if (entries.length === 0) {
    content = (
      <p style={message}>Este proveedor aún no tiene compras registradas.</p>
    );
  } else {
    content = (
      <div style={{ overflowX: 'auto', maxHeight: '60vh' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: 'var(--small-size)',
          }}
        >
          <thead>
            <tr
              style={{
                color: 'var(--color-muted)',
                fontSize: 'var(--caption-size)',
                textTransform: 'uppercase',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th style={cell}>Fecha</th>
              <th style={cell}>Insumo</th>
              <th style={cell}>Lote</th>
              <th style={{ ...cell, textAlign: 'right' }}>Cantidad</th>
              <th style={{ ...cell, textAlign: 'right' }}>Costo unitario</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.batchId}
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <td style={cell}>{formatDate(entry.purchasedAt)}</td>
                <td style={{ ...cell, whiteSpace: 'normal' }}>{entry.itemName}</td>
                <td style={cell}>{entry.batchNumber}</td>
                <td style={{ ...cell, textAlign: 'right' }}>
                  {entry.quantity} {entry.unit}
                </td>
                <td style={{ ...cell, textAlign: 'right' }}>
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
      maxWidth="720px"
    >
      {content}
    </Modal>
  );
}
