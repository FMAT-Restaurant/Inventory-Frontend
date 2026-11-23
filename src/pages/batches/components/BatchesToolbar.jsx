import { useEffect, useRef, useState } from "react";
import { Badge } from "../../../components/ui/Badge.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { SearchIcon, PlusIcon } from "../../../components/ui/Icons.jsx";
import {
  BATCH_CONDITION_OPTIONS,
  FILTER_STATUS_OPTIONS,
  STOCK_STATUS_LEGEND,
} from "../constants.js";
import { useAuth } from "../../../context/AuthContext";
import { PERMISSIONS } from "../../../config/permissions";

const STATUS_BUTTON_LABELS = {
  TODOS: "Todos",
  OPTIMO: "Óptimo",
  BAJO: "Stock bajo",
  CRITICO: "Agotado",
};

const selectStyle = {
  height: "var(--control-height)",
  padding: "0 12px",
  borderRadius: "var(--radius-control)",
  border: "1px solid var(--color-border)",
  backgroundColor: "#FFFFFF",
  fontSize: "var(--small-size)",
  color: "var(--color-text)",
  fontFamily: "inherit",
  outline: "none",
  cursor: "pointer",
};

export function BatchesToolbar({
  search,
  statusFilter,
  categoryFilter = "TODAS",
  batchConditionFilter = "TODOS",
  categories = [],
  hasActiveFilters = false,
  totalCount = 0,
  filteredCount = 0,
  onSearch,
  onStatusChange,
  onCategoryChange,
  onBatchConditionChange,
  onResetFilters,
  onNewPurchase,
  disabled = false,
}) {
  const { can } = useAuth();
  const canWrite = can(PERMISSIONS.BATCHES_WRITE);
  const [infoOpen, setInfoOpen] = useState(false);
  const infoWrapperRef = useRef(null);

  useEffect(() => {
    if (!infoOpen) return;

    const handleClickOutside = (event) => {
      if (
        infoWrapperRef.current &&
        !infoWrapperRef.current.contains(event.target)
      ) {
        setInfoOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setInfoOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [infoOpen]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Fila 1: búsqueda, categoría, estado de lotes y botón principal */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
            flex: "1 1 520px",
          }}
        >
          <div
            style={{
              width: "300px",
              maxWidth: "100%",
              position: "relative",
              flex: "1 1 240px",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--color-muted)",
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <SearchIcon size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, SKU, categoría o lote..."
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              style={{
                width: "100%",
                height: "var(--control-height)",
                paddingLeft: "38px",
                paddingRight: "12px",
                borderRadius: "var(--radius-control)",
                border: "1px solid var(--color-border)",
                backgroundColor: "#FFFFFF",
                fontSize: "var(--body-size)",
                color: "var(--color-text)",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            aria-label="Filtrar por categoría"
            value={categoryFilter}
            onChange={(e) => onCategoryChange?.(e.target.value)}
            style={selectStyle}
          >
            <option value="TODAS">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            aria-label="Filtrar por estado de lotes"
            value={batchConditionFilter}
            onChange={(e) => onBatchConditionChange?.(e.target.value)}
            style={selectStyle}
          >
            {BATCH_CONDITION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {canWrite && (
          <Button
            variant="primary"
            size="md"
            onClick={onNewPurchase}
            disabled={disabled}
          >
            <PlusIcon size={16} />
            <span>Registrar compra</span>
          </Button>
        )}
      </div>

      {/* Fila 2: estado de stock del insumo + botón informativo (i) + contador/limpiar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            ref={infoWrapperRef}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontSize: "var(--caption-size)",
                color: "var(--color-muted)",
                fontWeight: 600,
              }}
            >
              Estado de stock:
            </span>
            <button
              type="button"
              aria-label="Información sobre estados de stock"
              aria-expanded={infoOpen}
              onClick={() => setInfoOpen((prev) => !prev)}
              title="Ver qué significa cada estado de stock"
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "999px",
                border: "1px solid var(--color-border)",
                backgroundColor: infoOpen
                  ? "var(--color-primary-soft)"
                  : "#FFFFFF",
                color: infoOpen
                  ? "var(--color-primary)"
                  : "var(--color-muted)",
                fontSize: "12px",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                lineHeight: 1,
                padding: 0,
              }}
            >
              i
            </button>

            {infoOpen && (
              <div
                role="dialog"
                aria-label="Guía de estados de stock"
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  zIndex: 30,
                  width: "340px",
                  maxWidth: "90vw",
                  padding: "14px 16px",
                  borderRadius: "var(--radius-card, 10px)",
                  border: "1px solid var(--color-border)",
                  backgroundColor: "#FFFFFF",
                  boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <strong
                    style={{
                      fontSize: "var(--small-size)",
                      color: "var(--color-ink)",
                    }}
                  >
                    ¿Qué significa cada estado de stock?
                  </strong>
                  <button
                    type="button"
                    aria-label="Cerrar guía"
                    onClick={() => setInfoOpen(false)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "var(--color-muted)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {STOCK_STATUS_LEGEND.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                    }}
                  >
                    <div>
                      <Badge variant={item.variant}>{item.label}</Badge>
                    </div>
                    <span
                      style={{
                        fontSize: "var(--caption-size)",
                        color: "var(--color-muted)",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {FILTER_STATUS_OPTIONS.map((estado) => (
            <button
              key={estado}
              type="button"
              onClick={() => onStatusChange(estado)}
              style={{
                height: "32px",
                padding: "0 12px",
                borderRadius: "var(--radius-control)",
                border: `1px solid ${statusFilter === estado ? "var(--color-primary)" : "var(--color-border)"}`,
                background:
                  statusFilter === estado
                    ? "var(--color-primary-soft)"
                    : "#FFFFFF",
                color:
                  statusFilter === estado
                    ? "var(--color-primary)"
                    : "var(--color-text)",
                fontSize: "var(--caption-size)",
                fontWeight: statusFilter === estado ? 600 : 500,
                cursor: "pointer",
              }}
            >
              {STATUS_BUTTON_LABELS[estado] ?? estado}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            fontSize: "var(--caption-size)",
            color: "var(--color-muted)",
          }}
        >
          {totalCount > 0 && (
            <span>
              Mostrando <strong>{filteredCount}</strong> de{" "}
              <strong>{totalCount}</strong> insumos
            </span>
          )}
          {hasActiveFilters && onResetFilters && (
            <Button variant="tertiary" size="sm" onClick={onResetFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
