/**
 * Implementación HTTP del repositorio de movimientos para qa/prod.
 *
 * Contrato REST consumido (base = VITE_API_URL):
 *   GET /movements?batchId=&movementType=&referenceId=&from=&to=&limit=
 *
 * Los movimientos son de solo lectura.
 */

import { ENV } from "../../config/env";
import type {
  MovementFilters,
  MovementType,
  MovementsRepository,
  StockMovement,
} from "./types";

interface RawMovement {
  id?: string;
  _id?: string;
  batchId?: string | { _id?: string };
  movementType?: string;
  quantity?: number;
  referenceId?: string | null;
  reason?: string | null;
  createdBy?: string;
  createdAt?: string;
}

const MOVEMENT_TYPES: MovementType[] = ["in", "out", "waste", "adjustment"];

function normalizeType(value: unknown): MovementType {
  return MOVEMENT_TYPES.includes(value as MovementType)
    ? (value as MovementType)
    : "adjustment";
}

function normalizeId(value: RawMovement["batchId"]): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value._id ?? "");
}

function normalizeMovement(raw: RawMovement): StockMovement {
  return {
    id: String(raw.id ?? raw._id ?? ""),
    batchId: normalizeId(raw.batchId),
    movementType: normalizeType(raw.movementType),
    quantity: Number(raw.quantity ?? 0),
    referenceId: raw.referenceId ? String(raw.referenceId) : null,
    reason: raw.reason ? String(raw.reason) : null,
    createdBy: raw.createdBy ? String(raw.createdBy) : "system",
    createdAt: raw.createdAt ?? "",
  };
}

const getAuthToken = (): string | undefined => {
  try {
    const raw = localStorage.getItem("fmat_restaurant_auth_session");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return parsed?.accessToken || parsed?.token;
  } catch {
    return undefined;
  }
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) ?? {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${ENV.API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = Array.isArray(body?.message)
        ? body.message.join(", ")
        : body?.message || body?.error || "";
    } catch {
      detail = "";
    }
    throw new Error(detail || `Error ${response.status} al consumir ${path}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  if (!raw) {
    return undefined as T;
  }

  return JSON.parse(raw) as T;
}

function buildQuery(filters: MovementFilters): string {
  const params = new URLSearchParams();

  if (filters.batchId) params.set("batchId", filters.batchId);
  if (filters.movementType) params.set("movementType", filters.movementType);
  if (filters.referenceId) params.set("referenceId", filters.referenceId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.limit) params.set("limit", String(filters.limit));

  const query = params.toString();
  return query ? `?${query}` : "";
}

export const httpMovementsRepository: MovementsRepository = {
  async list(filters: MovementFilters = {}) {
    const items = await request<RawMovement[]>(
      `/movements${buildQuery(filters)}`,
    );
    return (items ?? [])
      .map(normalizeMovement)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  },
};
