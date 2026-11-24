import { Button } from "../../../components/ui/Button.jsx";
import { Input, Select } from "../../../components/ui/Input.jsx";
import { Modal } from "../../../components/ui/Modal.jsx";
import { assignedInactiveOption } from "../../../services/suppliers/labels";
import { isExpiredDateInput } from "../constants.js";

function supplierNameById(id, list) {
  if (!id) return "Sin proveedor";
  return list.find((s) => s.id === id)?.name ?? id;
}

export function BatchFormModal({
  isOpen,
  values,
  items,
  suppliers,
  allSuppliers = suppliers,
  error = "",
  saving = false,
  onChange,
  onClose,
  onSubmit,
}) {
  const isEditing = Boolean(values.id);
  const inactiveOption = assignedInactiveOption(values.supplierId, allSuppliers);
  const selectedItem = items.find((item) => item.id === values.itemId);
  const unit = selectedItem?.unit ?? "";
  const isExpiredDate = !isEditing && isExpiredDateInput(values.expirationDate);

  const hasConsumption =
    isEditing &&
    values.initialQuantity !== "" &&
    values.originalQuantity !== "" &&
    Number(values.originalQuantity) < Number(values.initialQuantity);

  const quantityChanged =
    isEditing &&
    values.originalQuantity !== "" &&
    Number(values.quantity) !== Number(values.originalQuantity);

  const quantityDelta = quantityChanged
    ? Math.round(
        (Number(values.quantity) - Number(values.originalQuantity)) * 1000,
      ) / 1000
    : 0;

  const changes = [];
  if (isEditing) {
    if ((values.supplierId || "") !== (values.originalSupplierId || "")) {
      changes.push(
        `Proveedor: ${supplierNameById(values.originalSupplierId, allSuppliers)} → ${supplierNameById(values.supplierId, allSuppliers)}`,
      );
    }
    if (
      (values.batchNumber || "").trim() !==
      (values.originalBatchNumber || "").trim()
    ) {
      changes.push(
        `Lote: ${values.originalBatchNumber} → ${(values.batchNumber || "").trim()}`,
      );
    }
    if (quantityChanged) {
      const sign = quantityDelta > 0 ? "+" : "";
      changes.push(
        `Cantidad: ${values.originalQuantity} → ${values.quantity} ${unit} (${sign}${quantityDelta} ${unit})`.trim(),
      );
    }
    if (
      values.originalCost !== "" &&
      Number(values.cost) !== Number(values.originalCost)
    ) {
      changes.push(
        `Costo: $${Number(values.originalCost).toFixed(2)} → $${Number(values.cost).toFixed(2)}`,
      );
    }
    if (
      values.originalExpirationDate &&
      values.expirationDate !== values.originalExpirationDate
    ) {
      changes.push(
        `Caducidad: ${values.originalExpirationDate} → ${values.expirationDate}`,
      );
    }
  }

  const hasChanges = !isEditing || changes.length > 0;

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
          disabled={hasConsumption}
        >
          <option value="">Sin proveedor específico</option>
          {inactiveOption && (
            <option value={inactiveOption.id}>{inactiveOption.label}</option>
          )}
          {suppliers.map((prov) => (
            <option key={prov.id} value={prov.id}>
              {prov.name}
            </option>
          ))}
        </Select>

        {values.lockItem ? (
          <Input
            label="Insumo a reabastecer"
            value={
              selectedItem
                ? `${selectedItem.name} (${selectedItem.unit})`
                : values.itemId
            }
            disabled
          />
        ) : (
          <Select
            label="Insumo a reabastecer"
            value={values.itemId}
            onChange={(e) => onChange("itemId", e.target.value)}
            required
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} ({item.unit})
              </option>
            ))}
          </Select>
        )}

        <Input
          label="Número de lote (opcional)"
          type="text"
          placeholder="Ej. LOTE-2026-001 (si se omite, se genera automáticamente)"
          value={values.batchNumber}
          onChange={(e) => onChange("batchNumber", e.target.value)}
          disabled={hasConsumption}
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
            helperText={
              quantityChanged
                ? `Ajuste: ${quantityDelta > 0 ? "+" : ""}${quantityDelta}${unit ? ` ${unit}` : ""}`
                : undefined
            }
          />
          <Input
            label="Costo unitario ($)"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="Ej. 45.00"
            value={values.cost}
            onChange={(e) => onChange("cost", e.target.value)}
            disabled={hasConsumption}
            required
          />
        </div>

        {quantityChanged && (
          <Input
            label="Motivo del ajuste"
            type="text"
            placeholder="Ej. Corrección por conteo físico"
            value={values.reason || ""}
            onChange={(e) => onChange("reason", e.target.value)}
            required
            helperText="Se guardará en la bitácora de movimientos para auditoría."
          />
        )}

        <Input
          label="Fecha de caducidad"
          type="date"
          min={isEditing && values.entryDate ? values.entryDate : undefined}
          value={values.expirationDate}
          onChange={(e) => onChange("expirationDate", e.target.value)}
          required
          helperText={
            isEditing
              ? "Cambiar la fecha modifica el orden de uso FEFO."
              : "Se registrará el lote con esta fecha de caducidad."
          }
        />

        {isExpiredDate && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-control)",
              backgroundColor: "var(--bg-warning, #FEF3C7)",
              color: "var(--color-warning, #92400E)",
              fontSize: "var(--caption-size)",
              lineHeight: 1.4,
            }}
          >
            La fecha seleccionada ya venció. Este lote se registrará como{" "}
            <strong>CADUCADO</strong> (ej. por hallazgo en conteo físico) y{" "}
            <strong>no sumará</strong> a la existencia disponible.
          </div>
        )}

        {isEditing && changes.length > 0 && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: "var(--radius-control)",
              backgroundColor: "#F8FAFC",
              border: "1px solid var(--color-border)",
              fontSize: "var(--caption-size)",
              color: "var(--color-text)",
              lineHeight: 1.45,
            }}
          >
            <strong style={{ display: "block", marginBottom: "4px" }}>
              Resumen de cambios:
            </strong>
            <span>{changes.join(" | ")}</span>
          </div>
        )}

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
          <Button
            variant="primary"
            type="submit"
            disabled={saving || !hasChanges}
          >
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : isExpiredDate
                  ? "Registrar lote vencido"
                  : "Guardar compra"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
