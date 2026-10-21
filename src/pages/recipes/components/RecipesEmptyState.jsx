import { Button } from "../../../components/ui/Button.jsx";
import { UtensilsIcon, PlusIcon } from "../../../components/ui/Icons.jsx";

export function RecipesEmptyState({
  hasSearchOrFilter,
  onResetFilters,
  onNewRecipe,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-card)",
        border: "1px dashed var(--color-border)",
        textAlign: "center",
        gap: "14px",
      }}
    >
      <div
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          backgroundColor: "var(--color-primary-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-primary)",
        }}
      >
        <UtensilsIcon size={28} color="var(--color-primary)" />
      </div>

      <div style={{ maxWidth: "420px" }}>
        <h3
          style={{
            fontSize: "var(--h3-size)",
            color: "var(--color-ink)",
            marginBottom: "6px",
          }}
        >
          {hasSearchOrFilter
            ? "No se encontraron recetas"
            : "No hay recetas registradas"}
        </h3>
        <p
          style={{
            fontSize: "var(--small-size)",
            color: "var(--color-muted)",
            lineHeight: "20px",
          }}
        >
          {hasSearchOrFilter
            ? "Intenta modificar los términos de búsqueda o cambiar el filtro de disponibilidad."
            : "Agrega tu primera receta para que el backend calcule costos y porciones en tiempo real."}
        </p>
      </div>

      <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
        {hasSearchOrFilter ? (
          <Button variant="secondary" size="sm" onClick={onResetFilters}>
            Limpiar filtros
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={onNewRecipe}>
            <PlusIcon size={16} />
            <span>Crear primera receta</span>
          </Button>
        )}
      </div>
    </div>
  );
}
