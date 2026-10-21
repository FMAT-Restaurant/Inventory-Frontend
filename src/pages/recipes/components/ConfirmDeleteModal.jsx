import { Modal } from "../../../components/ui/Modal.jsx";
import { Button } from "../../../components/ui/Button.jsx";
export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  recipe,
  loading,
}) {
  if (!recipe) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Eliminar Receta"
      maxWidth="480px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ fontSize: "var(--body-size)", color: "var(--color-text)" }}>
          ¿Estás seguro de que deseas eliminar la receta{" "}
          <strong style={{ color: "var(--color-ink)" }}>"{recipe.name}"</strong>{" "}
          con código <strong style={{ color: "var(--color-ink)" }}>{recipe.plateId}</strong>?
        </p>

        <div
          style={{
            padding: "12px 14px",
            backgroundColor: "var(--bg-warning)",
            color: "var(--color-warning)",
            borderRadius: "var(--radius-control)",
            fontSize: "var(--small-size)",
            lineHeight: "18px",
          }}
        >
          <strong>Advertencia de impacto operativo:</strong> Esta acción
          deshabilitará el platillo en cocina y detendrá el cálculo de
          disponibilidad y porciones para este código.
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          <Button variant="tertiary" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>

          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Eliminando..." : "Eliminar receta"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
