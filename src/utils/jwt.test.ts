import { describe, expect, it } from 'vitest';
import { decodeJwt } from './jwt';

/**
 * Tests del decodificador de JWT (solo payload, sin verificar firma).
 *
 * Se construyen tokens de prueba con un helper que codifica el payload en
 * base64url y UTF-8, igual que lo haría el emisor real (MS de Auth).
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

function makeToken(payload: unknown): string {
  return `${encodeSegment({ alg: 'HS256', typ: 'JWT' })}.${encodeSegment(payload)}.firma`;
}

describe('decodeJwt', () => {
  it('decodifica los claims del payload (sub, staffId, roles, permissions)', () => {
    const token = makeToken({
      iss: 'urn:fmat:restaurant:auth',
      sub: 'user-1',
      staffId: 'staff-9',
      email: 'mesero@fmat.mx',
      roles: ['MESERO'],
      permissions: ['inventory:items:read', 'inventory:movements:read'],
    });

    const claims = decodeJwt(token);

    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe('user-1');
    expect(claims?.staffId).toBe('staff-9');
    expect(claims?.email).toBe('mesero@fmat.mx');
    expect(claims?.roles).toEqual(['MESERO']);
    expect(claims?.permissions).toEqual([
      'inventory:items:read',
      'inventory:movements:read',
    ]);
  });

  it('decodifica payloads con caracteres UTF-8', () => {
    const token = makeToken({ sub: 'usuario-ñ', email: 'ñoñería@fmat.mx' });
    expect(decodeJwt(token)?.sub).toBe('usuario-ñ');
    expect(decodeJwt(token)?.email).toBe('ñoñería@fmat.mx');
  });

  it('devuelve null para cadenas que no son JWT', () => {
    expect(decodeJwt('no-es-un-jwt')).toBeNull();
    expect(decodeJwt('a.b')).toBeNull();
    expect(decodeJwt('header..firma')).toBeNull();
  });

  it('devuelve null si el payload no es JSON válido', () => {
    const notJson = btoa('esto no es json')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    expect(decodeJwt(`header.${notJson}.firma`)).toBeNull();
  });

  it('devuelve null si el payload no es un objeto', () => {
    expect(decodeJwt(makeToken([1, 2, 3]))).toBeNull();
    expect(decodeJwt(makeToken('texto'))).toBeNull();
  });

  it('devuelve null si la firma/base64 del payload es inválida', () => {
    expect(decodeJwt('header.@@@no-base64@@@.firma')).toBeNull();
  });
});
