import { calcularEstadoUmbral } from "../../services/inventory/businessRules.js";

export const UNIDADES = ["kg", "g", "l", "ml", "pza", "caja", "paquete"];

export const CONDICIONES_ALMACENAMIENTO = [
  "Ambiente",
  "Refrigerado",
  "Congelado",
  "Seco",
];

export const emptyForm = (suppliers = []) => ({
  id: "",
  sku: "",
  name: "",
  description: "",
  category: "",
  unit: "kg",
  minStock: "",
  isPerishable: false,
  storageCondition: CONDICIONES_ALMACENAMIENTO[0],
  supplierIdSugested: suppliers[0]?.id || "",
});

export const formFromItem = (item, suppliers = []) => ({
  id: item.id,
  sku: item.sku || "",
  name: item.name,
  description: item.description || "",
  category: item.category || "",
  unit: item.unit,
  minStock: String(item.minStock),
  isPerishable: Boolean(item.isPerishable),
  storageCondition: item.storageCondition || CONDICIONES_ALMACENAMIENTO[0],
  supplierIdSugested: item.supplierIdSugested || suppliers[0]?.id || "",
});

export const badgeVariant = (estado) =>
  estado === "CRITICO" ? "danger" : estado === "BAJO" ? "warning" : "success";

export const estadoLabel = (estado) =>
  estado === "CRITICO" ? "Agotado" : estado === "BAJO" ? "Bajo" : "Óptimo";

/**
 * Estado de umbral del insumo. Si el backend no lo envía, se deriva de
 * la misma regla de negocio que usa el inventario (disponible vs. mínimo).
 */
export const estadoDe = (item) => {
  if (item?.status) return item.status;
  return calcularEstadoUmbral(
    Number(item?.availableStock ?? 0),
    Number(item?.minStock ?? 0),
  );
};

/**
 * Colores del design system según el estado de umbral, para pintar la card.
 */
export const estadoColores = (estado) => {
  if (estado === "CRITICO") {
    return {
      background: "var(--bg-danger)",
      border: "var(--color-danger)",
      text: "var(--color-danger)",
    };
  }
  if (estado === "BAJO") {
    return {
      background: "var(--bg-warning)",
      border: "var(--color-warning)",
      text: "var(--color-warning)",
    };
  }
  return {
    background: "var(--bg-success)",
    border: "var(--color-success)",
    text: "var(--color-success)",
  };
};
