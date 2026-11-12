import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';

export function SupplierCard({
  supplier,
  onEdit,
  onDelete,
  onCostHistory,
  disabled = false,
}) {
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.SUPPLIERS_WRITE);
  return (
    <Card
      padding="20px"
      hoverable
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div>
        <h3 style={{ fontSize: 'var(--h3-size)', marginBottom: '12px' }}>
          {supplier.name}
        </h3>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: 'var(--small-size)',
          }}
        >
          {supplier.contactName && (
            <div>
              <span style={{ color: 'var(--color-muted)' }}>Contacto: </span>
              <strong style={{ color: 'var(--color-text)' }}>
                {supplier.contactName}
              </strong>
            </div>
          )}
          {supplier.phone && (
            <div>
              <span style={{ color: 'var(--color-muted)' }}>Teléfono: </span>
              <strong style={{ color: 'var(--color-text)' }}>
                {supplier.phone}
              </strong>
            </div>
          )}
          {supplier.email && (
            <div>
              <span style={{ color: 'var(--color-muted)' }}>Email: </span>
              <strong style={{ color: 'var(--color-text)' }}>
                {supplier.email}
              </strong>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          justifyContent: 'flex-end',
          flexWrap: 'wrap',
        }}
      >
        <Button variant="tertiary" size="sm" onClick={onCostHistory}>
          Historial de costos
        </Button>
        {canWrite && (
          <Button
            variant="tertiary"
            size="sm"
            onClick={onDelete}
            disabled={disabled}
          >
            Eliminar
          </Button>
        )}
        {canWrite && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onEdit}
            disabled={disabled}
          >
            Editar
          </Button>
        )}
      </div>
    </Card>
  );
}