import { Button } from "../../../components/ui/Button.jsx";
import { PlusIcon, SearchIcon } from "../../../components/ui/Icons.jsx";
import { RECIPE_FILTER_LABELS } from "../constants";

export function RecipesToolbar({
  search,
  onSearchChange,
  availability,
  onAvailabilityChange,
  onNewRecipe,
  loadingItems = false,
}) {
  const filterOptions = ["ALL", "AVAILABLE", "UNAVAILABLE"];

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
      {/* Buscador */}
      <div style={{ width: "340px", maxWidth: "100%", position: "relative" }}>
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
          placeholder="Buscar por nombre o plateId..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
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

      {/* Filtros de Disponibilidad y Botón de Acción */}
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
          Disponibilidad:
        </span>

        {filterOptions.map((filter) => {
          const isActive = availability === filter;
          return (
            <button
              key={filter}
              type="button"
              onClick={() => onAvailabilityChange(filter)}
              style={{
                height: "32px",
                padding: "0 12px",
                borderRadius: "var(--radius-control)",
                border: `1px solid ${isActive ? "var(--color-primary)" : "var(--color-border)"}`,
                background: isActive ? "var(--color-primary-soft)" : "#FFFFFF",
                color: isActive ? "var(--color-primary)" : "var(--color-text)",
                fontSize: "var(--caption-size)",
                fontWeight: isActive ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {RECIPE_FILTER_LABELS[filter]}
            </button>
          );
        })}

        <Button
          variant="primary"
          size="md"
          onClick={onNewRecipe}
          disabled={loadingItems}
        >
          <PlusIcon size={16} />
          <span>
            {loadingItems ? "Cargando insumos..." : "Nueva receta"}
          </span>
        </Button>
      </div>
    </div>
  );
}
