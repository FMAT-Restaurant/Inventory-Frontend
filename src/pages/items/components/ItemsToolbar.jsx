import { Button } from '../../../components/ui/Button.jsx';
import { SearchIcon, PlusIcon } from '../../../components/ui/Icons.jsx';
import { useAuth } from '../../../context/AuthContext';
import { PERMISSIONS } from '../../../config/permissions';

export function ItemsToolbar({
  search,
  category,
  categories,
  onSearch,
  onCategoryChange,
  onNew,
  disabled = false
}) {
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.ITEMS_WRITE);
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
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
            pointerEvents: 'none'
          }}
        >
          <SearchIcon size={16} />
        </div>
        <input
          type="text"
          placeholder="Buscar por nombre, SKU o categoría..."
          value={search}
          onChange={e => onSearch(e.target.value)}
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
            boxSizing: 'border-box'
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: 'wrap',
          minWidth: 0,
          maxWidth: '100%'
        }}
      >
        <span style={{ fontSize: 'var(--caption-size)', color: 'var(--color-muted)', fontWeight: 600 }}>
          Categoría:
        </span>
        <select
          value={category}
          onChange={e => onCategoryChange(e.target.value)}
          style={{
            height: '32px',
            padding: '0 12px',
            borderRadius: 'var(--radius-control)',
            border: '1px solid var(--color-border)',
            backgroundColor: '#FFFFFF',
            fontSize: 'var(--caption-size)',
            color: 'var(--color-text)',
            fontFamily: 'inherit',
            cursor: 'pointer',
            // Una categoría con nombre largo no debe ensanchar la página.
            minWidth: 0,
            maxWidth: 'min(240px, 100%)',
            textOverflow: 'ellipsis'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'TODAS' ? 'Todas' : cat}
            </option>
          ))}
        </select>
        {canWrite && (
          <Button variant="primary" size="md" onClick={onNew} disabled={disabled}>
            <PlusIcon size={16} />
            <span>Nuevo insumo</span>
          </Button>
        )}
      </div>
    </div>
  );
}