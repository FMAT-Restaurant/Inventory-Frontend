/**
 * Cliente HTTP compartido por los repositorios del frontend.
 *
 * Centraliza la lectura del token de sesión, la construcción de headers,
 * el manejo de errores del backend y el parseo de respuestas para evitar
 * duplicar esta lógica en cada repositorio.
 */

import { ENV } from "../../config/env";

export const AUTH_STORAGE_KEY = "fmat_restaurant_auth_session";

export interface StoredSession {
  accessToken?: string;
  token?: string;
  user?: unknown;
}

export function getStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : null;
  } catch {
    return null;
  }
}

export function getAuthToken(): string | undefined {
  const session = getStoredSession();
  return session?.accessToken || session?.token;
}

export class HttpError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "HttpError";
    this.status = status;
    this.detail = detail;
  }
}

function buildHeaders(options: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };

  const token = getAuthToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

async function parseErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (Array.isArray(body?.message)) {
      return body.message.join(", ");
    }
    return body?.message || body?.error || "";
  } catch {
    return "";
  }
}

export async function requestWithStatus<T>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; status: number }> {
  const response = await fetch(`${ENV.API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options),
  });

  if (!response.ok) {
    const detail = await parseErrorDetail(response);
    throw new HttpError(
      response.status,
      detail || `Error ${response.status} al consumir ${path}`,
    );
  }

  if (response.status === 204) {
    return { data: undefined as T, status: response.status };
  }

  const raw = await response.text();
  if (!raw) {
    return { data: undefined as T, status: response.status };
  }

  return { data: JSON.parse(raw) as T, status: response.status };
}

export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const { data } = await requestWithStatus<T>(path, options);
  return data;
}
