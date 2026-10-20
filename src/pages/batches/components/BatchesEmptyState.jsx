import { Card } from "../../../components/ui/Card.jsx";
import { PackageIcon } from "../../../components/ui/Icons.jsx";

export function BatchesEmptyState({ loading = false }) {
  return (
    <Card padding="32px">
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "12px",
          color: "var(--color-muted)",
        }}
      >
        <PackageIcon size={32} />
        <p style={{ fontSize: "var(--small-size)" }}>
          {loading
            ? "Cargando insumos y lotes..."
            : "No se encontraron insumos con esos criterios."}
        </p>
      </div>
    </Card>
  );
}
