import { Card } from "../../../components/ui/Card.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { UtensilsIcon } from "../../../components/ui/Icons.jsx";

export function RecipeCard({
  recipe,
  onViewDetail,
  onEdit,
  onDelete,
}) {
  const missingItems = (recipe.items || []).filter(
    (item) => !item.hasSufficientStock,
  );
  const isIncomplete = !recipe.items || recipe.items.length === 0;

  return (
    <Card
      padding="18px"
      hoverable
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <div>
        {/* Banner Ilustrativo FMAT v2.0 */}
        <div
          style={{
            height: "100px",
            borderRadius: "8px",
            backgroundColor: "var(--color-primary-soft)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "12px",
            color: "var(--color-primary)",
            gap: "6px",
          }}
        >
          <UtensilsIcon size={26} color="var(--color-primary)" />
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--color-primary)",
            }}
          >
            {recipe.plateId}
          </span>
        </div>

        {/* Badges de Estado */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "8px",
            flexWrap: "wrap",
          }}
        >
          <Badge variant={recipe.isAvailable ? "success" : "danger"}>
            {recipe.isAvailable ? "Disponible" : "Agotado"}
          </Badge>

          {isIncomplete && (
            <Badge variant="warning">Sin insumos registrados</Badge>
          )}
        </div>

        {/* Título */}
        <h3
          style={{
            fontSize: "var(--h3-size)",
            marginBottom: "10px",
            color: "var(--color-ink)",
          }}
        >
          {recipe.name}
        </h3>

        {/* Métricas calculadas por Backend (Solo Lectura) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            fontSize: "var(--small-size)",
            backgroundColor: "var(--color-canvas)",
            padding: "10px 12px",
            borderRadius: "var(--radius-control)",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--color-muted)" }}>
              Porciones preparables:
            </span>
            <strong
              style={{
                color:
                  recipe.maxPreparablePortions > 0
                    ? "var(--color-ink)"
                    : "var(--color-danger)",
                fontSize: "15px",
              }}
            >
              {recipe.maxPreparablePortions}{" "}
              {recipe.maxPreparablePortions === 1 ? "porción" : "porciones"}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--color-muted)" }}>
              Costo de producción:
            </span>
            <strong style={{ color: "var(--color-ink)" }}>
              ${Number(recipe.productionCost || 0).toFixed(2)}
            </strong>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ color: "var(--color-muted)" }}>
              Insumos requeridos:
            </span>
            <span>{recipe.items?.length || 0} ingredientes</span>
          </div>
        </div>

        {/* Insumos faltantes en caso de no disponibilidad */}
        {missingItems.length > 0 && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--color-danger)",
              backgroundColor: "var(--bg-danger)",
              padding: "8px 10px",
              borderRadius: "6px",
              marginBottom: "8px",
              lineHeight: "15px",
            }}
          >
            <strong>Insumos sin stock suficiente:</strong>{" "}
            {missingItems
              .map((i) => i.ingredientName || i.ingredientId)
              .join(", ")}
          </div>
        )}
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          onClick={() => onViewDetail(recipe)}
        >
          Ver receta
        </Button>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Button
            variant="tertiary"
            size="sm"
            onClick={() => onEdit(recipe)}
          >
            Editar
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(recipe)}
          >
            Eliminar
          </Button>
        </div>
      </div>
    </Card>
  );
}
