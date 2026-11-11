/**
 * Decodificación del payload de un JWT (sin verificar la firma).
 *
 * La verificación de la firma la realizan el API Gateway y el backend;
 * el frontend solo necesita leer los claims (`sub`, `roles`,
 * `permissions`, etc.) para ajustar la interfaz. Cualquier token
 * inválido o malformado produce `null` y la UI no restringe nada.
 */

export interface JwtClaims {
  sub?: string | number;
  staffId?: string | number;
  email?: string;
  roles?: unknown;
  permissions?: unknown;
  [claim: string]: unknown;
}

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function decodeJwt(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => !part)) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1]));
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      return null;
    }
    return payload as JwtClaims;
  } catch {
    return null;
  }
}
