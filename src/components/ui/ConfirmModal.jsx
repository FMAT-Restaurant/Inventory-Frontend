import { Modal } from './Modal.jsx';
import { Button } from './Button.jsx';
import { AlertCircleIcon } from './Icons.jsx';

/**
 * Modal de alerta / confirmación reutilizable según especificación FMAT-RESTAURANT v2.0
 */
export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar acción',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  variant = 'destructive',
  loading = false
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="440px">
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          padding: '12px 14px',
          borderRadius: 'var(--radius-control)',
          backgroundColor: variant === 'destructive' ? 'var(--bg-danger)' : '#F3F4F6',
          color: variant === 'destructive' ? 'var(--color-danger)' : 'var(--color-text)'
        }}
      >
        <div style={{ flexShrink: 0, marginTop: '2px' }}>
          <AlertCircleIcon size={20} />
        </div>
        <p style={{ fontSize: 'var(--body-size)', color: 'var(--color-ink)', margin: 0, lineHeight: 1.5 }}>
          {message}
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button variant="tertiary" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant={variant} onClick={onConfirm} disabled={loading}>
          {loading ? 'Procesando...' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
