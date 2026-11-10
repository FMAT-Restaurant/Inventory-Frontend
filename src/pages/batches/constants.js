export const FILTER_STATUS_OPTIONS = ["TODOS", "OPTIMO", "BAJO", "CRITICO"];

export const emptyBatchForm = (items = [], preselectedItemId = "") => ({
  id: "",
  batchNumber: "",
  // Sin proveedor por defecto: asignarlo es una decisión explícita.
  supplierId: "",
  itemId: preselectedItemId || items[0]?.id || "",
  quantity: "",
  cost: "",
  expirationDate: "",
  lockItem: Boolean(preselectedItemId),
});

export const formFromBatch = (batch) => ({
  id: batch.id,
  batchNumber: batch.batchNumber || "",
  // Se muestra el proveedor del lote, nunca otro en su lugar.
  supplierId: batch.supplierId || "",
  itemId: batch.itemId,
  quantity: String(batch.quantity ?? ""),
  cost: String(batch.cost ?? ""),
  expirationDate: batch.expirationDate || "",
  lockItem: true,
});

export const itemStatusVariant = (status) =>
  status === "CRITICO" ? "danger" : status === "BAJO" ? "warning" : "success";

export const itemStatusLabel = (status) =>
  status === "CRITICO" ? "Agotado" : status === "BAJO" ? "Bajo" : "Óptimo";

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
