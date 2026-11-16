import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Pagination, getPageItems } from './Pagination.jsx';

describe('getPageItems', () => {
  it('muestra todas las páginas cuando son pocas', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('abrevia con puntos suspensivos y conserva primera, última y vecinas', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, '…', 20]);
    expect(getPageItems(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
    expect(getPageItems(20, 20)).toEqual([1, '…', 19, 20]);
  });

  it('ajusta una página fuera de rango', () => {
    expect(getPageItems(99, 20)).toEqual([1, '…', 19, 20]);
    expect(getPageItems(0, 20)).toEqual([1, 2, '…', 20]);
  });
});

describe('Pagination', () => {
  afterEach(cleanup);

  it('no se muestra con una sola página', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onChange={() => undefined} />,
    );
    expect(container.innerHTML).toBe('');
  });

  it('cambia de página con anterior, siguiente y los números', () => {
    const onChange = vi.fn();
    render(<Pagination page={2} totalPages={5} onChange={onChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    fireEvent.click(screen.getByRole('button', { name: 'Página 5' }));

    expect(onChange.mock.calls.map(([page]) => page)).toEqual([1, 3, 5]);
  });

  it('marca la página actual y deshabilita los extremos', () => {
    render(<Pagination page={1} totalPages={3} onChange={() => undefined} />);

    const button = (name: string) =>
      screen.getByRole('button', { name }) as HTMLButtonElement;

    expect(button('Anterior').disabled).toBe(true);
    expect(button('Página 1').getAttribute('aria-current')).toBe('page');
    expect(button('Siguiente').disabled).toBe(false);
  });

  it('bloquea todo mientras carga', () => {
    render(
      <Pagination page={2} totalPages={5} onChange={() => undefined} disabled />,
    );

    for (const button of screen.getAllByRole('button')) {
      expect((button as HTMLButtonElement).disabled).toBe(true);
    }
  });
});
