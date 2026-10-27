import { Card } from "../../../components/ui/Card.jsx";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { ChevronDownIcon } from "../../../components/ui/Icons.jsx";
import {
  batchStatusLabel,
  batchStatusVariant,
  itemStatusLabel,
  itemStatusVariant,
} from "../constants.js";

export function BatchItemCard({
  item,
  batches,
  expanded,
  onToggleExpand,
  onNewPurchase,
  onEditBatch,
  onDeleteBatch,
  disabled = false,
}) {
  return (
    <Card padding="20px">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <h3 style={{ fontSize: "var(--h3-size)" }}>{item.name}</h3>
            <span
              style={{
                fontSize: "var(--caption-size)",
                backgroundColor: "#F3F4F6",
                padding: "2px 8px",
                borderRadius: "4px",
                color: "var(--color-muted)",
              }}
            >
              {item.category}
            </span>
            <Badge variant={itemStatusVariant(item.status)}>
              {itemStatusLabel(item.status)}
            </Badge>
          </div>

          <div
            style={{
              display: "flex",
              gap: "24px",
              marginTop: "10px",
              flexWrap: "wrap",
              fontSize: "var(--small-size)",
            }}
          >
            <div>
              <span style={{ color: "var(--color-muted)" }}>
                Existencia Disponible:{" "}
              </span>
              <strong style={{ color: "var(--color-ink)", fontSize: "15px" }}>
                {item.availableStock} {item.unit}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--color-muted)" }}>Comprometido: </span>
              <strong
                style={{
                  color:
                    item.reservedStock > 0
                      ? "var(--color-primary)"
                      : "var(--color-muted)",
                }}
              >
                {item.reservedStock} {item.unit}
              </strong>
            </div>
            <div>
              <span style={{ color: "var(--color-muted)" }}>Stock Total: </span>
              <strong>
                {item.totalStock} {item.unit}
              </strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button variant="tertiary" size="sm" onClick={onToggleExpand}>
            <span>Lotes ({batches.length})</span>
            <ChevronDownIcon
              size={14}
              style={{
                transform: expanded ? "rotate(180deg)" : "none",
                transition: "transform 0.15s ease",
              }}
            />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewPurchase}
            disabled={disabled}
          >
            + Comprar
          </Button>
        </div>
      </div>

      {expanded && (
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid var(--color-border)",
            backgroundColor: "var(--color-canvas)",
            padding: "16px",
            borderRadius: "var(--radius-control)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <span
              style={{
                fontSize: "var(--caption-size)",
                fontWeight: 700,
                color: "var(--color-muted)",
                textTransform: "uppercase",
              }}
            >
              Lotes registrados (ordenados por fecha de vencimiento)
            </span>
          </div>

          {batches.length === 0 ? (
            <p
              style={{
                fontSize: "var(--small-size)",
                color: "var(--color-muted)",
              }}
            >
              No hay lotes registrados.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {batches.map((lote, index) => {
                const esPrioridad =
                  index === 0 &&
                  (lote.status === "active" ||
                    lote.status === "expires_today") &&
                  lote.quantity > 0;

                return (
                  <div
                    key={lote.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                      padding: "10px 14px",
                      backgroundColor: esPrioridad ? "#FFFFFF" : "#F9FAFB",
                      border: `1px solid ${esPrioridad ? "var(--color-primary)" : "var(--color-border)"}`,
                      borderRadius: "var(--radius-control)",
                      fontSize: "var(--small-size)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "14px",
                        flexWrap: "wrap",
                      }}
                    >
                      <strong style={{ color: "var(--color-ink)" }}>
                        {lote.batchNumber}
                      </strong>
                      <span>
                        Vence:{" "}
                        <strong style={{ color: "var(--color-ink)" }}>
                          {lote.expirationDate}
                        </strong>
                      </span>
                      {lote.entryDate && (
                        <span style={{ color: "var(--color-muted)" }}>
                          Ingreso: {lote.entryDate}
                        </span>
                      )}
                      <span style={{ color: "var(--color-muted)" }}>
                        Costo: ${Number(lote.cost).toFixed(2)}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span>
                        Cantidad: <strong>{lote.quantity}</strong> /{" "}
                        {lote.initialQuantity} {item.unit}
                      </span>
                      <Badge variant={batchStatusVariant(lote.status)}>
                        {batchStatusLabel(lote.status)}
                      </Badge>
                      {esPrioridad && (
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "var(--color-primary)",
                            backgroundColor: "var(--color-primary-soft)",
                            padding: "2px 8px",
                            borderRadius: "4px",
                          }}
                        >
                          Prioridad de uso
                        </span>
                      )}
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => onEditBatch(lote)}
                        disabled={disabled}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="tertiary"
                        size="sm"
                        onClick={() => onDeleteBatch(lote)}
                        disabled={disabled}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
