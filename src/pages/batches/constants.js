export const FILTER_STATUS_OPTIONS = ["TODOS", "OPTIMO", "BAJO", "CRITICO"];

export const BATCH_CONDITION_OPTIONS = [
  { value: "TODOS", label: "Todos los lotes" },
  { value: "CON_CADUCADOS", label: "Con lotes caducados" },
  { value: "VENCE_HOY", label: "Con lotes que vencen hoy" },
  { value: "SOLO_ACTIVOS", label: "Con lotes activos" },
  { value: "SIN_LOTES", label: "Sin lotes registrados" },
];

export const STOCK_STATUS_LEGEND = [
  {
    key: "OPTIMO",
    label: "Óptimo",
    variant: "success",
    description:
      "La existencia disponible supera el umbral mínimo configurado del insumo (disponible > umbral mínimo).",
  },
  {
    key: "BAJO",
    label: "Stock bajo",
    variant: "warning",
    description:
      "La existencia disponible está en o por debajo del umbral mínimo (0 < disponible ≤ umbral mínimo). Conviene reabastecer.",
  },
  {
    key: "CRITICO",
    label: "Agotado",
    variant: "danger",
    description:
      "Sin existencia disponible utilizable (disponible = 0). No hay stock activo o vigente para consumir.",
  },
];

export const emptyBatchForm = (items = [], preselectedItemId = "") => ({
  id: "",
  batchNumber: "",
  originalBatchNumber: "",
  // Sin proveedor por defecto: asignarlo es una decisión explícita.
  supplierId: "",
  originalSupplierId: "",
  itemId: preselectedItemId || items[0]?.id || "",
  initialQuantity: "",
  quantity: "",
  originalQuantity: "",
  cost: "",
  originalCost: "",
  expirationDate: "",
  originalExpirationDate: "",
  entryDate: "",
  reason: "",
  lockItem: Boolean(preselectedItemId),
});

export const formFromBatch = (batch) => ({
  id: batch.id,
  batchNumber: batch.batchNumber || "",
  originalBatchNumber: batch.batchNumber || "",
  // Se muestra el proveedor del lote, nunca otro en su lugar.
  supplierId: batch.supplierId || "",
  originalSupplierId: batch.supplierId || "",
  itemId: batch.itemId,
  initialQuantity: String(batch.initialQuantity ?? batch.quantity ?? ""),
  quantity: String(batch.quantity ?? ""),
  originalQuantity: String(batch.quantity ?? ""),
  cost: String(batch.cost ?? ""),
  originalCost: String(batch.cost ?? ""),
  expirationDate: batch.expirationDate || "",
  originalExpirationDate: batch.expirationDate || "",
  entryDate: batch.entryDate || "",
  reason: "",
  lockItem: true,
});

export const isExpiredDateInput = (dateStr) => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split("-").map(Number);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const selected = new Date(y, m - 1, d);
  return selected < today;
};

export const formatFullBatchNumber = (batchNumber, sku) => {
  const code = String(batchNumber || "").trim();
  const normalizedSku = String(sku || "").trim().toUpperCase();
  if (!code) return "";
  if (normalizedSku && !code.toUpperCase().startsWith(`${normalizedSku}-`)) {
    return `${normalizedSku}-${code}`;
  }
  return code;
};

export const itemStatusVariant = (status) =>
  status === "CRITICO" ? "danger" : status === "BAJO" ? "warning" : "success";

export const itemStatusLabel = (status) =>
  status === "CRITICO" ? "Agotado" : status === "BAJO" ? "Stock bajo" : "Óptimo";

export const batchStatusVariant = (status) => {
  if (status === "expired") return "danger";
  if (status === "expires_today") return "warning";
  if (status === "depleted") return "neutral";
  return "success";
};

export const batchStatusLabel = (status) => {
  if (status === "expired") return "CADUCADO";
  if (status === "expires_today") return "VENCE HOY";
  if (status === "depleted") return "AGOTADO";
  return "ACTIVO";
};
