import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/Button.jsx';
import { Input, Select } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';
import { useWaste } from '../hooks/useWaste';

const EMPTY_FORM = { batchId: '', quantity: '', reason: '' };

/**
 * Registro de merma: el lote en el que se generó, la cantidad perdida y el
 * motivo. La cantidad se descuenta del lote y queda en el historial.
 */
export function WasteFormModal({ isOpen, onClose, onSaved }) {
  const { batchOptions, loading, saving, error, clearError, register } =
    useWaste(isOpen);
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await register({
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
        <Select
          label="Lote"
          value={form.batchId}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, batchId: e.target.value }))
          }
          disabled={loading || saving}
          required
        >
          <option value="">
            {loading
              ? 'Cargando lotes...'
              : batchOptions.length === 0
                ? 'No hay lotes con existencias'
                : 'Selecciona un lote'}
          </option>
          {batchOptions.map((option) => (
            <option key={option.batchId} value={option.batchId}>
              {option.itemName} · {option.batchNumber} ({option.quantity}{' '}
              {option.unit})
            </option>
          ))}
        </Select>

        <Input
          label="Cantidad perdida"
          type="number"
          step="0.001"
          min="0.001"
          max={selectedBatch ? String(selectedBatch.quantity) : undefined}
          value={form.quantity}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, quantity: e.target.value }))
          }
          helperText={
            selectedBatch
              ? `En el lote: ${selectedBatch.quantity} ${selectedBatch.unit}. Se descontará del lote.`
              : undefined
          }
          required
        />

        <Input
          label="Motivo"
          value={form.reason}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, reason: e.target.value }))
          }
          placeholder="Ej. Se echó a perder, se cayó, producto dañado"
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

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '8px',
          }}
        >
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
