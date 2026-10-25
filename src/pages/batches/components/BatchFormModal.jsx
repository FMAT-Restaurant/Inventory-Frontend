import { Button } from "../../../components/ui/Button.jsx";
import { Input, Select } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { formatBatchCode } from "../constants.js";

export function BatchFormModal({
  isOpen,
  values,
  ingredients,
  suppliers,
  error = "",
  saving = false,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(values.id);
  const selectedIngredient = ingredients.find(
    (ing) => ing.id === values.ingredientId,
  );
  const selectedSku = selectedIngredient?.sku || "";

  const formatIngredientOption = (ing) =>
    `${ing.sku ? `${ing.sku} · ` : ""}${ing.name} (${ing.unit})`;

  const batchHelperText = isEditing
    ? "El código de lote no puede modificarse por trazabilidad."
    : values.batchNumber?.trim()
      ? `Se registrará como: ${formatBatchCode(selectedSku, values.batchNumber)}`
      : selectedSku
        ? `Se combinará con el SKU (${selectedSku}-...). Si se omite, se genera automáticamente.`
        : "Si se omite, se genera automáticamente.";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Editar Lote" : "Registrar Compra a Proveedor"}
    >
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        <Select
          label="Proveedor"
          value={values.supplierId}
          onChange={(e) => onChange("supplierId", e.target.value)}
          disabled={isEditing}
        >
          <option value="">Sin proveedor específico</option>
          {suppliers.map((prov) => (
            <option key={prov.id} value={prov.id}>
              {prov.name}
            </option>
          ))}
        </Select>

        {values.lockIngredient ? (
          <Input
            label="Insumo a reabastecer"
            value={
              selectedIngredient
                ? formatIngredientOption(selectedIngredient)
                : values.ingredientId
            }
            disabled
          />
        ) : (
          <Select
            label="Insumo a reabastecer"
            value={values.ingredientId}
            onChange={(e) => onChange("ingredientId", e.target.value)}
            required
          >
            {ingredients.map((ing) => (
              <option key={ing.id} value={ing.id}>
                {formatIngredientOption(ing)}
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Número de lote (opcional)"
          type="text"
          placeholder={
            selectedSku
              ? `Ej. 2026-001 -> ${selectedSku}-2026-001`
              : "Ej. LOTE-2026-001 (si se omite, se genera automáticamente)"
          }
          value={
            isEditing
              ? formatBatchCode(selectedSku, values.batchNumber)
              : values.batchNumber
          }
          onChange={(e) => onChange("batchNumber", e.target.value)}
          disabled={isEditing}
          helperText={batchHelperText}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
          }}
        >
          <Input
            label={isEditing ? "Cantidad actual" : "Cantidad comprada"}
            type="number"
            step="0.01"
            min={isEditing ? "0" : "0.01"}
            placeholder="Ej. 10.5"
            value={values.quantity}
            onChange={(e) => onChange("quantity", e.target.value)}
            required
          />
          <Input
            label="Costo unitario ($)"
            type="number"
            step="0.01"
            min="0"
            placeholder="Ej. 45.00"
            value={values.cost}
            onChange={(e) => onChange("cost", e.target.value)}
            required
          />
        </div>

        <Input
          label="Fecha de caducidad"
          type="date"
          value={values.expirationDate}
          onChange={(e) => onChange("expirationDate", e.target.value)}
          required
          helperText="Se registrará el lote con esta fecha de caducidad."
        />

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
                : "Guardar compra"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
