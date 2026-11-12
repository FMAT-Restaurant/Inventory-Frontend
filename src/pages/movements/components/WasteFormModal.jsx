import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { Input, Select } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { useWaste } from '../hooks/useWaste';

const EMPTY_FORM = { orderId: '', batchId: '', quantity: '', reason: '' };

/**
 * Registro de merma de una orden servida: la pérdida de un insumo que ya se
 * descontó del inventario. No modifica el stock, solo queda en el historial.
 */
export function WasteFormModal({ isOpen, onClose, onSaved }) {
  const {
    orders,
    batchOptions,
    loading,
    saving,
    error,
    clearError,
    loadConsumed,
    register,
  } = useWaste(isOpen);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) {
      setForm(EMPTY_FORM);
      clearError();
    }
  }, [isOpen, clearError]);

  const selectedBatch = batchOptions.find(
    (option) => option.batchId === form.batchId,
  );

  const handleOrderChange = (orderId) => {
    setForm({ ...EMPTY_FORM, orderId });
    void loadConsumed(orderId);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await register({
        orderId: form.orderId,
        batchId: form.batchId,
        quantity: Number(form.quantity),
        reason: form.reason,
      });
      onSaved?.();
      onClose();
    } catch {
      // El hook expone el error en el modal.
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar merma">
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <p style={{ fontSize: 'var(--small-size)', color: 'var(--color-muted)' }}>
          Registra la pérdida de insumos de una orden ya servida. El stock ya se
          descontó al servirla, así que la merma no lo modifica.
        </p>

        <Select
          label="Orden servida"
          value={form.orderId}
          onChange={(e) => handleOrderChange(e.target.value)}
          disabled={loading || saving}
          required
        >
          <option value="">
            {loading
              ? 'Cargando órdenes...'
              : orders.length === 0
                ? 'No hay órdenes servidas'
                : 'Selecciona una orden'}
          </option>
          {orders.map((order) => (
            <option key={order.orderId} value={order.orderId}>
              {order.orderId}
            </option>
          ))}
        </Select>

        <Select
          label="Lote consumido"
          value={form.batchId}
          onChange={(e) => setForm((prev) => ({ ...prev, batchId: e.target.value }))}
          disabled={!form.orderId || saving}
          required
        >
          <option value="">
            {form.orderId && batchOptions.length === 0
              ? 'La orden no consumió lotes'
              : 'Selecciona un lote'}
          </option>
          {batchOptions.map((option) => (
            <option
              key={option.batchId}
              value={option.batchId}
              disabled={option.remaining <= 0}
            >
              {option.itemName} · {option.batchNumber} (disponible para merma:{' '}
              {option.remaining} {option.unit})
            </option>
          ))}
        </Select>

        <Input
          label="Cantidad perdida"
          type="number"
          step="0.001"
          min="0.001"
          max={selectedBatch ? String(selectedBatch.remaining) : undefined}
          value={form.quantity}
          onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
          helperText={
            selectedBatch
              ? `Consumido: ${selectedBatch.consumed} ${selectedBatch.unit}. Ya registrado como merma: ${selectedBatch.alreadyWasted} ${selectedBatch.unit}.`
              : undefined
          }
          required
        />

        <Input
          label="Motivo"
          value={form.reason}
          onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
          placeholder="Ej. Platillo devuelto sin reingreso posible"
          required
        />

        {error && (
          <span
            style={{
              fontSize: 'var(--caption-size)',
              color: 'var(--color-danger)',
              fontWeight: 500,
            }}
          >
            {error}
          </span>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="tertiary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saving || loading}>
            {saving ? 'Guardando...' : 'Registrar merma'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
