import { Modal } from "../../../components/ui/Modal.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";

export function RecipeDetailModal({
  recipe,
  isOpen,
  onClose,
}) {
  if (!recipe) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Receta: ${recipe.name}`}
      maxWidth="640px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        {/* Cabecera de Métricas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "10px",
            backgroundColor: "var(--color-canvas)",
            padding: "12px",
            borderRadius: "var(--radius-control)",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "var(--caption-size)",
                color: "var(--color-muted)",
              }}
            >
              Código (plateId):
            </span>
            <div style={{ fontWeight: 700, color: "var(--color-ink)" }}>
              {recipe.plateId}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: "var(--caption-size)",
                color: "var(--color-muted)",
              }}
            >
              Costo de producción:
            </span>
            <div style={{ fontWeight: 700, color: "var(--color-primary)" }}>
              ${Number(recipe.productionCost || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: "var(--caption-size)",
                color: "var(--color-muted)",
              }}
            >
              Porciones preparables:
            </span>
            <div
              style={{
                fontWeight: 700,
                color:
                  recipe.maxPreparablePortions > 0
                    ? "var(--color-success)"
                    : "var(--color-danger)",
              }}
            >
              {recipe.maxPreparablePortions}
            </div>
          </div>
        </div>

        {/* Tabla de Insumos Requeridos */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <h4
              style={{
                fontSize: "var(--small-size)",
                fontWeight: 600,
                color: "var(--color-ink)",
              }}
            >
              Insumos requeridos por porción:
            </h4>
            <span
              style={{
                fontSize: "var(--caption-size)",
                color: "var(--color-muted)",
              }}
            >
              Cálculo en tiempo real
            </span>
          </div>

          <div
            style={{
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-control)",
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "var(--small-size)",
                textAlign: "left",
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: "var(--color-canvas)",
                    borderBottom: "1px solid var(--color-border)",
                    color: "var(--color-muted)",
                    fontSize: "var(--caption-size)",
                  }}
                >
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Insumo
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Requerido
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    En Almacén
                  </th>
                  <th style={{ padding: "10px 14px", fontWeight: 600 }}>
                    Suficiencia
                  </th>
                </tr>
              </thead>
              <tbody>
                {recipe.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      style={{
                        padding: "16px",
                        textAlign: "center",
                        color: "var(--color-muted)",
                      }}
                    >
                      Esta receta no tiene insumos registrados.
                    </td>
                  </tr>
                ) : (
                  recipe.items.map((item, idx) => (
                    <tr
                      key={item.itemId || idx}
                      style={{
                        borderBottom:
                          idx < recipe.items.length - 1
                            ? "1px solid var(--color-border)"
                            : "none",
                        backgroundColor: item.hasSufficientStock
                          ? "#FFFFFF"
                          : "var(--bg-danger)",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: 500 }}>
                        {item.itemName || item.itemId}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {item.requiredQuantity} {item.unit}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {item.availableStock} {item.unit}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <Badge
                          variant={
                            item.hasSufficientStock ? "success" : "danger"
                          }
                        >
                          {item.hasSufficientStock
                            ? "Suficiente"
                            : "Insuficiente"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fechas de auditoría */}
        {(recipe.createdAt || recipe.updatedAt) && (
          <div
            style={{
              fontSize: "var(--caption-size)",
              color: "var(--color-muted)",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {recipe.createdAt && (
              <span>
                Creado: {new Date(recipe.createdAt).toLocaleDateString()}
              </span>
            )}
            {recipe.updatedAt && (
              <span>
                Última actualización:{" "}
                {new Date(recipe.updatedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Botón Cerrar */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button variant="primary" onClick={onClose}>
            Cerrar detalle
          </Button>
        </div>
      </div>
    </Modal>
  );
}
