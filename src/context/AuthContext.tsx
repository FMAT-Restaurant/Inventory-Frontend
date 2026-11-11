/**
 * Contexto de autenticación y permisos del módulo de inventario.
 *
 * Resuelve la identidad del usuario con la siguiente prioridad:
 *   1. Props del Shell federado (`currentUser`) — flujo objetivo: el token
 *      lo emite el MS de Auth y llega vía API Gateway.
 *   2. Usuario persistido en la sesión de localStorage.
 *   3. Claims del JWT efectivo (token de federación, sesión o
 *      `VITE_AUTH_TOKEN`) decodificados localmente sin verificar firma.
 *
 * Política de acceso:
 *   - Con usuario identificado: se aplican sus `permissions`
 *     (catálogo `inventory:<entidad>:<acción>`), con bypass para ADMIN/"*".
 *   - Sin identidad (dev sin auth, mocks, e2e): fail-open, todo visible.
 *     El backend y el gateway siguen siendo la barrera real.
 */
import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  AUTH_STORAGE_KEY,
  getAuthToken,
  getStoredSession,
} from "../services/http/client";
import { decodeJwt } from "../utils/jwt";

export interface ShellUser {
  id: string;
  userType: "ADMIN" | "STAFF";
  staffId?: string;
  email?: string;
  displayName: string;
  roleLabel?: string;
  roles?: string[];
  permissions: string[];
}

export function hasPermission(
  user: ShellUser | null | undefined,
  requiredPermission: string,
): boolean {
  if (!user) return false;
  if (user.userType === "ADMIN" || user.permissions?.includes("*")) {
    return true;
  }
  if (!user.permissions) return false;
  return user.permissions.includes(requiredPermission);
}

export interface AuthContextValue {
  user: ShellUser | null;
  token: string | undefined;
  /** Indica si el usuario (o ausencia de identidad) permite el permiso. */
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function resolveUserFromToken(token: string | undefined): ShellUser | null {
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims || !Array.isArray(claims.permissions)) {
    // Sin claim `permissions` no hay forma de determinar permisos:
    // se trata como sin identidad (fail-open).
    return null;
  }
  const permissions = claims.permissions.map(String);
  if (permissions.length === 0) {
    return null;
  }

  const roles = Array.isArray(claims.roles) ? claims.roles.map(String) : [];
  const email = typeof claims.email === "string" ? claims.email : undefined;
  const id = String(claims.sub ?? "");

  return {
    id,
    userType: roles.some((role) => role.toUpperCase() === "ADMIN")
      ? "ADMIN"
      : "STAFF",
    staffId: claims.staffId !== undefined ? String(claims.staffId) : undefined,
    email,
    displayName: email ?? (id ? `Usuario ${id}` : "Usuario"),
    roles,
    permissions,
  };
}

function isShellUserLike(user: unknown): user is ShellUser {
  return (
    typeof user === "object" &&
    user !== null &&
    Array.isArray((user as ShellUser).permissions)
  );
}

function resolveAuth(
  federationToken?: string,
  federatedUser?: ShellUser,
): AuthContextValue {
  // Persistir sesión cuando el Shell federado provee el token
  // (compatibilidad con el flujo actual del host).
  if (federationToken) {
    try {
      const stored = getStoredSession();
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({
          accessToken: federationToken,
          user: federatedUser ?? stored?.user ?? null,
        }),
      );
    } catch {
      // localStorage no disponible: continuar sin persistir.
    }
  }

  const effectiveToken = federationToken ?? getAuthToken();
  const storedUser = getStoredSession()?.user;
  const user =
    federatedUser ??
    (isShellUserLike(storedUser) ? storedUser : null) ??
    resolveUserFromToken(effectiveToken);

  return {
    user,
    token: effectiveToken,
    can: (permission: string) =>
      user ? hasPermission(user, permission) : true,
  };
}

export function AuthProvider({
  token,
  currentUser,
  children,
}: {
  token?: string;
  currentUser?: ShellUser;
  children: ReactNode;
}) {
  const value = useMemo(
    () => resolveAuth(token, currentUser),
    [token, currentUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context) return context;
  // Sin provider (pruebas de componentes aislados): resolver directo.
  return resolveAuth();
}
