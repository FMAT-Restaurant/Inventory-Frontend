import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { AuthProvider, hasPermission, useAuth } from './AuthContext';
import { AUTH_STORAGE_KEY } from '../services/http/client';
import { PERMISSIONS } from '../config/permissions';
import type { ShellUser } from './AuthContext';

/**
 * Tests del contexto de autenticación y permisos.
 *
 * Estrategia:
 *  - `renderHook` para consumir `useAuth()` dentro de un `AuthProvider`.
 *  - Tokens JWT de prueba construidos localmente (payload base64url UTF-8)
 *    con claims `sub`/`roles`/`permissions` como los emite el MS de Auth.
 *  - El test de `VITE_AUTH_TOKEN` re-importa los módulos tras estilizar la
 *    variable porque `ENV` se congela al cargar el módulo.
 */

function encodeSegment(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function makeToken(payload: Record<string, unknown>): string {
  return `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(payload)}.firma`;
}

function makeUser(permissions: string[]): ShellUser {
  return {
    id: 'user-1',
    userType: 'STAFF',
    displayName: 'Usuario de prueba',
    permissions,
  };
}

function withProvider(props: { token?: string; currentUser?: ShellUser }) {
  return function Provider({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider token={props.token} currentUser={props.currentUser}>
        {children}
      </AuthProvider>
    );
  };
}

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    vi.unstubAllEnvs();
  });

  it('sin identidad permite todo (fail-open para dev/mocks/e2e)', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({}),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.can(PERMISSIONS.ITEMS_READ)).toBe(true);
    expect(result.current.can(PERMISSIONS.ITEMS_WRITE)).toBe(true);
  });

  it('aplica los permisos del usuario de federación', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({
        currentUser: makeUser([PERMISSIONS.ITEMS_READ]),
      }),
    });

    expect(result.current.user?.id).toBe('user-1');
    expect(result.current.can(PERMISSIONS.ITEMS_READ)).toBe(true);
    expect(result.current.can(PERMISSIONS.ITEMS_WRITE)).toBe(false);
  });

  it('ADMIN tiene bypass de permisos', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({
        currentUser: { ...makeUser([]), userType: 'ADMIN' },
      }),
    });

    expect(result.current.can(PERMISSIONS.ITEMS_READ)).toBe(true);
    expect(result.current.can(PERMISSIONS.ITEMS_WRITE)).toBe(true);
  });

  it('el permiso "*" habilita todo', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({ currentUser: makeUser(['*']) }),
    });

    expect(result.current.can(PERMISSIONS.RECIPES_READ)).toBe(true);
  });

  it('deriva el usuario y permisos del token de federación', () => {
    const token = makeToken({
      sub: 'user-token',
      staffId: 'staff-1',
      roles: ['MESERO'],
      permissions: [PERMISSIONS.BATCHES_READ],
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({ token }),
    });

    expect(result.current.user?.id).toBe('user-token');
    expect(result.current.user?.userType).toBe('STAFF');
    expect(result.current.can(PERMISSIONS.BATCHES_READ)).toBe(true);
    expect(result.current.can(PERMISSIONS.ITEMS_READ)).toBe(false);
  });

  it('un rol ADMIN en el token otorga bypass', () => {
    const token = makeToken({
      sub: 'user-admin',
      roles: ['ADMIN'],
      permissions: [PERMISSIONS.MOVEMENTS_READ],
    });
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({ token }),
    });

    expect(result.current.user?.userType).toBe('ADMIN');
    expect(result.current.can(PERMISSIONS.ITEMS_WRITE)).toBe(true);
  });

  it('un token sin claim permissions se trata como sin identidad', () => {
    const token = makeToken({ sub: 'user-sin-perms', roles: ['MESERO'] });
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({ token }),
    });

    expect(result.current.user).toBeNull();
    expect(result.current.can(PERMISSIONS.ITEMS_READ)).toBe(true);
  });

  it('usa el usuario persistido en la sesión de localStorage', () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'x',
        user: makeUser([PERMISSIONS.SUPPLIERS_READ]),
      }),
    );
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({}),
    });

    expect(result.current.user?.id).toBe('user-1');
    expect(result.current.can(PERMISSIONS.SUPPLIERS_READ)).toBe(true);
    expect(result.current.can(PERMISSIONS.SUPPLIERS_WRITE)).toBe(false);
  });

  it('prioriza currentUser sobre el usuario persistido', () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        accessToken: 'x',
        user: makeUser([PERMISSIONS.SUPPLIERS_READ]),
      }),
    );
    const { result } = renderHook(() => useAuth(), {
      wrapper: withProvider({
        currentUser: makeUser([PERMISSIONS.ITEMS_READ]),
      }),
    });

    expect(result.current.can(PERMISSIONS.ITEMS_READ)).toBe(true);
    expect(result.current.can(PERMISSIONS.SUPPLIERS_READ)).toBe(false);
  });

  it('persiste la sesión cuando el Shell federado provee el token', () => {
    const token = makeToken({
      sub: 'user-federado',
      permissions: [PERMISSIONS.ITEMS_READ],
    });
    renderHook(() => useAuth(), { wrapper: withProvider({ token }) });

    const stored = JSON.parse(
      localStorage.getItem(AUTH_STORAGE_KEY) ?? '{}',
    ) as { accessToken?: string };
    expect(stored.accessToken).toBe(token);
  });

  it('usa VITE_AUTH_TOKEN cuando no hay sesión ni props de federación', async () => {
    vi.stubEnv(
      'VITE_AUTH_TOKEN',
      makeToken({ sub: 'user-env', permissions: [PERMISSIONS.MOVEMENTS_READ] }),
    );
    vi.resetModules();
    const { AuthProvider: Provider, useAuth: useAuthHook } = await import(
      './AuthContext'
    );

    const { result } = renderHook(() => useAuthHook(), {
      wrapper: ({ children }: { children: React.ReactNode }) => (
        <Provider>{children}</Provider>
      ),
    });

    expect(result.current.user?.id).toBe('user-env');
    expect(result.current.can(PERMISSIONS.MOVEMENTS_READ)).toBe(true);
    expect(result.current.can(PERMISSIONS.ITEMS_READ)).toBe(false);
  });
});

describe('hasPermission', () => {
  it('sin usuario devuelve false', () => {
    expect(hasPermission(undefined, PERMISSIONS.ITEMS_READ)).toBe(false);
  });

  it('requiere el permiso exacto', () => {
    const user = makeUser([PERMISSIONS.ITEMS_READ]);
    expect(hasPermission(user, PERMISSIONS.ITEMS_READ)).toBe(true);
    expect(hasPermission(user, PERMISSIONS.ITEMS_WRITE)).toBe(false);
  });
});
