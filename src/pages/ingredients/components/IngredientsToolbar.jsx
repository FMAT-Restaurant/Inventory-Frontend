import { Button } from '../../../components/ui/Button.jsx';
import { SearchIcon, PlusIcon } from '../../../components/ui/Icons.jsx';

export function IngredientsToolbar({
  search,
  category,
  categories,
  onSearch,
  onCategoryChange,
  onNew,
  disabled = false
}) {
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
          placeholder="Buscar por nombre o categoría..."
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

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
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
            cursor: 'pointer'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === 'TODAS' ? 'Todas' : cat}
            </option>
          ))}
        </select>
        <Button variant="primary" size="md" onClick={onNew} disabled={disabled}>
          <PlusIcon size={16} />
          <span>Nuevo ingrediente</span>
        </Button>
      </div>
    </div>
  );
}