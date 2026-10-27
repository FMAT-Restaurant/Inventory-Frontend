import { Card } from "../../../components/ui/Card.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { ChevronDownIcon } from "../../../components/ui/Icons.jsx";
import {
  badgeVariant,
  estadoColores,
  estadoDe,
  estadoLabel,
} from "../constants.js";

export function ItemCard({
  item,
  supplier,
  expanded = false,
  onToggleExpand,
  onEdit,
  onDelete,
  disabled = false,
}) {
  const estado = estadoDe(item);
  const colores = estadoColores(estado);

  const handleHeaderKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onToggleExpand?.();
  };

  return (
    <Card
      className="item-card"
      padding="20px"
      hoverable
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
        backgroundColor: colores.background,
        border: `1px solid ${colores.border}`,
      }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={`${expanded ? "Cerrar" : "Ver detalle de"} ${item.name}`}
        onClick={onToggleExpand}
        onKeyDown={handleHeaderKeyDown}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
        }}
      >
        <div style={{ minWidth: 0 }}>
          <h3 style={{ fontSize: "var(--h3-size)" }}>{item.name}</h3>
          <div
            style={{
              marginTop: "4px",
              fontSize: "var(--small-size)",
              color: "var(--color-muted)",
            }}
          >
            Disponible:{" "}
            <strong style={{ color: "var(--color-ink)" }}>
              {item.availableStock} {item.unit}
            </strong>{" "}
            / Mínimo:{" "}
            <strong style={{ color: "var(--color-ink)" }}>
              {item.minStock} {item.unit}
            </strong>
          </div>
        </div>

        <ChevronDownIcon
          size={18}
          color={colores.border}
          style={{
            flexShrink: 0,
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 0.15s ease",
          }}
        />
      </div>

      {expanded && (
        <div
          style={{
            padding: "16px",
            borderRadius: "var(--radius-control)",
            border: "1px solid var(--color-border)",
            backgroundColor: "rgba(255, 255, 255, 0.65)",
          }}
        >
          <div style={{ marginBottom: "10px" }}>
            <Badge variant={badgeVariant(estado)}>{estadoLabel(estado)}</Badge>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "var(--caption-size)",
                backgroundColor: "#F3F4F6",
                padding: "2px 8px",
                borderRadius: "4px",
                color: "var(--color-muted)",
              }}
            >
              {item.category || "General"}
            </span>
            <span
              style={{
                fontSize: "var(--caption-size)",
                backgroundColor: "#F3F4F6",
                padding: "2px 8px",
                borderRadius: "4px",
                color: "var(--color-muted)",
                fontFamily: "monospace",
              }}
            >
              {item.sku || "Sin SKU"}
            </span>
          </div>

          {item.description && (
            <div
              style={{
                marginTop: "8px",
                fontSize: "var(--caption-size)",
                color: "var(--color-muted)",
              }}
            >
              {item.description}
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px",
              marginTop: "16px",
              fontSize: "var(--small-size)",
            }}
          >
            <div>
              <span style={{ color: "var(--color-muted)" }}>Disponible: </span>
              <strong style={{ color: "var(--color-ink)" }}>
                {item.availableStock} {item.unit}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--color-muted)" }}>Stock total: </span>
              <strong>
                {item.totalStock} {item.unit}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--color-muted)" }}>Mínimo: </span>
              <strong>
                {item.minStock} {item.unit}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--color-muted)" }}>Costo prom.: </span>
              <strong>${Number(item.averageCost).toFixed(2)}</strong>
            </div>
          </div>

          <div
            style={{
              marginTop: "12px",
              fontSize: "var(--caption-size)",
              color: "var(--color-muted)",
            }}
          >
            Proveedor sugerido:{" "}
            <strong style={{ color: "var(--color-text)" }}>
              {supplier?.name || "Sin asignar"}
            </strong>
          </div>

          <div
            style={{
              marginTop: "6px",
              fontSize: "var(--caption-size)",
              color: "var(--color-muted)",
            }}
          >
            Condición de almacenamiento:{" "}
            <strong style={{ color: "var(--color-text)" }}>
              {item.storageCondition || "Sin definir"}
            </strong>{" "}
            · Perecedero:{" "}
            <strong style={{ color: "var(--color-text)" }}>
              {item.isPerishable ? "Sí" : "No"}
            </strong>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
        <Button
          variant="tertiary"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
        >
          Eliminar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onEdit}
          disabled={disabled}
        >
          Editar
        </Button>
      </div>
    </Card>
  );
}
