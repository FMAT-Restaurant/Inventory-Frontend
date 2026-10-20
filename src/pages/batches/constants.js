export const FILTER_STATUS_OPTIONS = ["TODOS", "OPTIMO", "BAJO", "CRITICO"];

export const emptyBatchForm = (
  suppliers = [],
  ingredients = [],
  preselectedIngredientId = "",
) => ({
  id: "",
  batchNumber: "",
  supplierId: suppliers[0]?.id || "",
  ingredientId: preselectedIngredientId || ingredients[0]?.id || "",
  quantity: "",
  cost: "",
  expirationDate: "",
  lockIngredient: Boolean(preselectedIngredientId),
});

export const formFromBatch = (batch, suppliers = []) => ({
  id: batch.id,
  batchNumber: batch.batchNumber || "",
  supplierId: batch.supplierId || suppliers[0]?.id || "",
  ingredientId: batch.ingredientId,
  quantity: String(batch.quantity ?? ""),
  cost: String(batch.cost ?? ""),
  expirationDate: batch.expirationDate || "",
  lockIngredient: true,
});

export const ingredientStatusVariant = (status) =>
  status === "CRITICO" ? "danger" : status === "BAJO" ? "warning" : "success";

export const ingredientStatusLabel = (status) =>
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
