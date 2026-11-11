import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MainMenu } from './MainMenu.jsx';
import { AuthProvider } from '../../context/AuthContext';
import { PERMISSIONS } from '../../config/permissions';
import type { ShellUser } from '../../context/AuthContext';

/**
 * Tests del menú principal con permisos.
 *
 * Sin jest-dom: se usan `getByText`/`queryByText` con aserciones de
 * vitest. Las tarjetas se ocultan cuando el usuario no tiene el permiso
 * de lectura del módulo; sin usuario (fail-open) se muestran todas.
 */

function renderMenu(user?: ShellUser, onSelectModule = vi.fn()) {
  const view = render(
    <AuthProvider currentUser={user}>
      <MainMenu onSelectModule={onSelectModule} />
    </AuthProvider>,
  );
  return { view, onSelectModule };
}

describe('MainMenu', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  it('sin usuario muestra las 5 tarjetas (fail-open)', () => {
    renderMenu(undefined);

    expect(screen.getByText('Catálogo de Insumos')).not.toBeNull();
    expect(screen.getByText('Lotes')).not.toBeNull();
    expect(screen.getByText('Proveedores')).not.toBeNull();
    expect(screen.getByText('Catálogo y Recetas')).not.toBeNull();
    expect(screen.getByText('Movimientos de Almacén')).not.toBeNull();
  });

  it('ADMIN ve todas las tarjetas', () => {
    renderMenu({
      id: 'u1',
      userType: 'ADMIN',
      displayName: 'Admin',
      permissions: [],
    });

    expect(screen.getByText('Catálogo de Insumos')).not.toBeNull();
    expect(screen.getByText('Movimientos de Almacén')).not.toBeNull();
  });

  it('oculta las tarjetas sin permiso de lectura', () => {
    renderMenu({
      id: 'u1',
      userType: 'STAFF',
      displayName: 'Consultor',
      permissions: [PERMISSIONS.ITEMS_READ, PERMISSIONS.MOVEMENTS_READ],
    });

    expect(screen.getByText('Catálogo de Insumos')).not.toBeNull();
    expect(screen.getByText('Movimientos de Almacén')).not.toBeNull();
    expect(screen.queryByText('Lotes')).toBeNull();
    expect(screen.queryByText('Proveedores')).toBeNull();
    expect(screen.queryByText('Catálogo y Recetas')).toBeNull();
  });

  it('muestra aviso cuando el usuario no tiene acceso a ningún módulo', () => {
    renderMenu({
      id: 'u1',
      userType: 'STAFF',
      displayName: 'Sin acceso',
      permissions: [],
    });

    expect(
      screen.getByText(
        'No tienes permisos para acceder a ningún módulo de inventario.',
      ),
    ).not.toBeNull();
  });

  it('notifica el módulo seleccionado al hacer clic en una tarjeta', () => {
    const onSelectModule = vi.fn();
    renderMenu(undefined, onSelectModule);

    fireEvent.click(screen.getByText('Catálogo de Insumos'));

    expect(onSelectModule).toHaveBeenCalledWith('items');
  });
});
