/**
 * Implementación HTTP del registro de mermas.
 *
 * Contrato REST consumido (base = VITE_API_URL):
 *   POST /movements/waste  { batchId, quantity, reason }
 */

import { request } from "../http/client";
import type { WasteRepository } from "./types";

export const httpWasteRepository: WasteRepository = {
  async register(input) {
    await request<unknown>("/movements/waste", {
      method: "POST",
      body: JSON.stringify({
        batchId: input.batchId,
        quantity: Number(input.quantity),
        reason: input.reason.trim(),
      }),
    });
  },
};
