import { Button } from './Button.jsx';

/**
 * Números de página a mostrar: siempre la primera y la última, la actual con
 * sus vecinas y `'…'` donde se omiten páginas. Ej. (6, 12) -> 1 … 5 6 7 … 12
 */
export function getPageItems(page, totalPages, siblings = 1) {
  const total = Math.max(1, Math.trunc(totalPages) || 1);
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), total);

  // Primera + última + actual + vecinas + 2 posibles puntos suspensivos
  const maxWithoutGaps = siblings * 2 + 5;
  if (total <= maxWithoutGaps) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const left = Math.max(current - siblings, 2);
  const right = Math.min(current + siblings, total - 1);
  const items = [1];

  if (left > 2) items.push('…');
  for (let value = left; value <= right; value += 1) items.push(value);
  if (right < total - 1) items.push('…');
  items.push(total);

  return items;
}

/**
 * Paginación numerada con anterior/siguiente. No sabe de datos: el padre
 * controla `page` y recibe el cambio en `onChange(nuevaPagina)`.
 */
export function Pagination({ page, totalPages, onChange, disabled = false }) {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <nav
      aria-label="Paginación"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexWrap: 'wrap',
      }}
    >
      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onChange(page - 1)}
        disabled={disabled || page <= 1}
      >
        Anterior
      </Button>

      {items.map((item, index) =>
        typeof item === 'string' ? (
          <span
            key={`gap-after-${items[index - 1]}`}
            aria-hidden="true"
            style={{ padding: '0 4px', color: 'var(--color-muted)' }}
          >
            …
          </span>
        ) : (
          <Button
            key={item}
            variant={item === page ? 'primary' : 'tertiary'}
            size="sm"
            onClick={() => onChange(item)}
            disabled={disabled || item === page}
            aria-label={`Página ${item}`}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        variant="tertiary"
        size="sm"
        onClick={() => onChange(page + 1)}
        disabled={disabled || page >= totalPages}
      >
        Siguiente
      </Button>
    </nav>
  );
}
