import { Card } from '../../../components/ui/Card.jsx';
import { TruckIcon } from '../../../components/ui/Icons.jsx';

export function SuppliersEmptyState({ loading = false }) {
  return (
    <Card padding="32px">
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--color-muted)',
        }}
      >
        <TruckIcon size={32} />
        <p style={{ fontSize: 'var(--small-size)' }}>
          {loading
            ? 'Cargando proveedores...'
            : 'No se encontraron proveedores con esos criterios.'}
        </p>
      </div>
    </Card>
  );
}