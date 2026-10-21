import { Button } from '../../../components/ui/Button.jsx';
import { SearchIcon, PlusIcon } from '../../../components/ui/Icons.jsx';

export function SuppliersToolbar({
  search,
  onSearch,
  onNew,
  disabled = false,
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      <div style={{ width: '320px', maxWidth: '100%', position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-muted)',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          <SearchIcon size={16} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, contacto, teléfono o email..."
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          style={{
            width: '100%',
            height: 'var(--control-height)',
            paddingLeft: '38px',
            paddingRight: '12px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: '#FFFFFF',
            fontSize: 'var(--body-size)',
            color: 'var(--color-text)',
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <Button variant="primary" size="md" onClick={onNew} disabled={disabled}>
        <PlusIcon size={16} />
        <span>Nuevo proveedor</span>
      </Button>
    </div>
  );
}