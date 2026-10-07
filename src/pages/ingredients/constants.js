export const UNIDADES = ["kg", "g", "l", "ml", "pza", "caja", "paquete"];

export const emptyForm = (suppliers = []) => ({
  id: "",
  name: "",
  category: "",
  unit: "kg",
  minStock: "",
  supplierIdSugested: suppliers[0]?.id || "",
});

export const formFromIngredients = (ingrediente, suppliers = []) => ({
  id: ingrediente.id,
  name: ingrediente.name,
  category: ingrediente.category || "",
  unit: ingrediente.unit,
  minStock: String(ingrediente.min),
  supplierIdSugested: ingrediente.supplierIdSugested || suppliers[0]?.id || "",
});

export const badgeVariant = (estado) =>
  estado === "CRITICO" ? "danger" : estado === "BAJO" ? "warning" : "success";

export const estadoLabel = (estado) =>
  estado === "CRITICO" ? "Agotado" : estado === "BAJO" ? "Bajo" : "Óptimo";
