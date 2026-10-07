import { Card } from "../../../components/ui/Card.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { badgeVariant, estadoLabel } from "../constants.js";

export function IngredientCard({
  ingredient,
  supplier,
  onEdit,
  onDelete,
  disabled = false,
}) {
  return (
    <Card
      padding="20px"
      hoverable
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
          }}
        >
          <h3 style={{ fontSize: "var(--h3-size)" }}>{ingredient.name}</h3>
          <Badge variant={badgeVariant(ingredient.estadoUmbral)}>
            {estadoLabel(ingredient.estadoUmbral)}
          </Badge>
        </div>

        <div style={{ marginTop: "8px" }}>
          <span
            style={{
              fontSize: "var(--caption-size)",
              backgroundColor: "#F3F4F6",
              padding: "2px 8px",
              borderRadius: "4px",
              color: "var(--color-muted)",
            }}
          >
            {ingredient.category || "General"}
          </span>
        </div>

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
              {ingredient.availableStock} {ingredient.unit}
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--color-muted)" }}>Stock total: </span>
            <strong>
              {ingredient.totalStock} {ingredient.unit}
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--color-muted)" }}>Mínimo: </span>
            <strong>
              {ingredient.minStock} {ingredient.unit}
            </strong>
          </div>
          <div>
            <span style={{ color: "var(--color-muted)" }}>Costo prom.: </span>
            <strong>${Number(ingredient.costoPromedio).toFixed(2)}</strong>
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
            {supplier?.nombre || "Sin asignar"}
          </strong>
        </div>
      </div>

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
