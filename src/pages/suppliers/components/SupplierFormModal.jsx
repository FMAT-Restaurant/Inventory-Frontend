import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Modal } from '../../../components/ui/Modal.jsx';

export function SupplierFormModal({
  isOpen,
  values,
  error = '',
  saving = false,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(values.id);

  // Ternario anidado extraído a variable para legibilidad
  // (SonarCloud: "Extract this nested ternary operation into an
  // independent statement").
  const submitLabel = saving
    ? 'Guardando...'
    : isEditing
      ? 'Guardar cambios'
      : 'Agregar proveedor';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
    >
      <form
        onSubmit={onSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
      >
        <Input
          label="Nombre"
          placeholder="Ej. Distribuidora Central"
          value={values.name}
          onChange={(e) => onChange('name', e.target.value)}
          required
          helperText="Obligatorio y único. Si ya existe, el backend responderá con conflicto."
        />

        <Input
          label="Nombre del contacto"
          placeholder="Ej. Juan Pérez"
          value={values.contactName}
          onChange={(e) => onChange('contactName', e.target.value)}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
          }}
        >
          <Input
            label="Teléfono"
            placeholder="Ej. +52 55 1234 5678"
            value={values.phone}
            onChange={(e) => onChange('phone', e.target.value)}
          />
          <Input
            label="Correo electrónico"
            type="email"
            placeholder="Ej. contacto@proveedor.com"
            value={values.email}
            onChange={(e) => onChange('email', e.target.value)}
            helperText="Opcional. Se valida el formato."
          />
        </div>

        <Input
          label="Dirección"
          placeholder="Ej. Av. Reforma 123, CDMX"
          value={values.address}
          onChange={(e) => onChange('address', e.target.value)}
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
            marginTop: '12px',
          }}
        >
          <Button variant="tertiary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}