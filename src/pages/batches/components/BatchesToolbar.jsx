import { Button } from "../../../components/ui/Button.jsx";
import { SearchIcon, PlusIcon } from "../../../components/ui/Icons.jsx";
import { FILTER_STATUS_OPTIONS } from "../constants.js";

export function BatchesToolbar({
  search,
  statusFilter,
  onSearch,
  onStatusChange,
  onNewPurchase,
  disabled = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ width: "320px", maxWidth: "100%", position: "relative" }}>
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
          placeholder="Buscar por nombre o categoría..."
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
            color: "var(--color-muted)",
            fontWeight: 600,
          }}
        >
          Filtrar:
        </span>
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
            {estado === "TODOS"
              ? "Todos"
              : estado === "OPTIMO"
                ? "Óptimo"
                : estado === "BAJO"
                  ? "Bajo"
                  : "Agotado"}
          </button>
        ))}
        <Button
          variant="primary"
          size="md"
          onClick={onNewPurchase}
          disabled={disabled}
        >
          <PlusIcon size={16} />
          <span>Registrar compra</span>
        </Button>
      </div>
    </div>
  );
}
