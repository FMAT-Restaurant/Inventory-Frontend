import { Button } from "../../../components/ui/Button.jsx";
import { Input, Select } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { UNIDADES } from "../constants.js";

export function IngredientFormModal({
  isOpen,
  values,
  suppliers,
  error = "",
  saving = false,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(values.id);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Ingrediente" : "Nuevo Ingrediente"}
    >
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <Input
          label="Nombre"
          placeholder="Ej. Harina de Trigo Extra"
          value={values.name}
          onChange={(e) => onChange("name", e.target.value)}
          required
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <Input
            label="Categoría"
            placeholder="Ej. Abarrotes"
            value={values.category}
            onChange={(e) => onChange("category", e.target.value)}
            helperText="Opcional. Por defecto: General."
          />
          <Select
            label="Unidad de medida"
            value={values.unit}
            onChange={(e) => onChange("unit", e.target.value)}
            required
          >
            {UNIDADES.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </Select>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <Input
            label="Umbral mínimo"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej. 10"
            value={values.minStock}
            onChange={(e) => onChange("minStock", e.target.value)}
            required
          />
        </div>

        <Select
          label="Proveedor sugerido"
          value={values.supplierIdSugested}
          onChange={(e) => onChange("supplierIdSugested", e.target.value)}
        >
          <option value="">Sin asignar</option>
          {suppliers.map((prov) => (
            <option key={prov.id} value={prov.id}>
              {prov.name}
            </option>
          ))}
        </Select>

        {error && (
          <span
            style={{
              fontSize: "var(--caption-size)",
              color: "var(--color-danger)",
              fontWeight: 500,
            }}
          >
            {error}
          </span>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            marginTop: "12px",
          }}
        >
          <Button variant="tertiary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Agregar ingrediente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
