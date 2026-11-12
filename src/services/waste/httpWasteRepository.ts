/**
 * Implementación HTTP del registro de mermas.
 *
 * Contrato REST consumido (base = VITE_API_URL):
 *   GET  /reservations?status=consumed              -> órdenes servidas
 *   GET  /movements?referenceId=:orderId&movementType=out|waste
 *   POST /movements/waste  { orderId, batchId, quantity, reason }
 */

import { request } from "../http/client";
import type { ConsumedBatch, WasteRepository } from "./types";

interface RawReservation {
  orderId: string;
  updatedAt?: string;
}

interface RawMovement {
  batchId?: string | { _id?: string };
  quantity?: number;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function batchIdOf(movement: RawMovement): string {
  const value = movement.batchId;
  if (!value) return "";
  return typeof value === "string" ? value : String(value._id ?? "");
}

function sumByBatch(movements: RawMovement[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const movement of movements ?? []) {
    const id = batchIdOf(movement);
    if (!id) continue;
    totals.set(id, round((totals.get(id) ?? 0) + Number(movement.quantity ?? 0)));
  }
  return totals;
}

function movementsQuery(orderId: string, movementType: "out" | "waste") {
  const params = new URLSearchParams({ referenceId: orderId, movementType });
  return `/movements?${params.toString()}`;
}

export const httpWasteRepository: WasteRepository = {
  async listServedOrders() {
    const reservations = await request<RawReservation[]>(
      "/reservations?status=consumed",
    );
    return (reservations ?? []).map((reservation) => ({
      orderId: reservation.orderId,
      servedAt: reservation.updatedAt,
    }));
  },

  async listConsumedBatches(orderId) {
    const [out, waste] = await Promise.all([
      request<RawMovement[]>(movementsQuery(orderId, "out")),
      request<RawMovement[]>(movementsQuery(orderId, "waste")),
    ]);
    const consumed = sumByBatch(out);
    const wasted = sumByBatch(waste);

    const result: ConsumedBatch[] = [];
    for (const [batchId, total] of consumed.entries()) {
      const alreadyWasted = wasted.get(batchId) ?? 0;
      result.push({
        batchId,
        consumed: total,
        alreadyWasted,
        remaining: round(Math.max(0, total - alreadyWasted)),
      });
    }
    return result;
  },

  async register(input) {
    await request<unknown>("/movements/waste", {
      method: "POST",
      body: JSON.stringify({
        orderId: input.orderId,
        batchId: input.batchId,
        quantity: Number(input.quantity),
        reason: input.reason.trim(),
      }),
    });
  },
};
