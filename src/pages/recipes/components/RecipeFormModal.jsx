import { useState } from "react";
import { Modal } from "../../../components/ui/Modal.jsx";
import { Button } from "../../../components/ui/Button.jsx";
import { Input } from "../../../components/ui/Input.jsx";
import { PlusIcon } from "../../../components/ui/Icons.jsx";
import { MIN_REQUIRED_QUANTITY } from "../constants";

export function RecipeFormModal({
  isOpen,
  onClose,
  recipeToEdit,
  availableItems,
  loadingItems,
  onSave,
  saving,
}) {
  const [plateId, setPlateId] = useState(() => recipeToEdit?.plateId || "");
  const [name, setName] = useState(() => recipeToEdit?.name || "");
  const [items, setItems] = useState(() => {
    if (Array.isArray(recipeToEdit?.items) && recipeToEdit.items.length > 0) {
      return recipeToEdit.items.map((i) => ({
        itemId: i.itemId,
        requiredQuantity: String(i.requiredQuantity),
      }));
    }
    return [{ itemId: "", requiredQuantity: "" }];
  });
  const [formError, setFormError] = useState(null);

  const handleAddItem = () => {
    setItems((prev) => [...prev, { itemId: "", requiredQuantity: "" }]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    const cleanPlateId = plateId.trim();
    const cleanName = name.trim();

    if (!cleanPlateId) {
      setFormError("El identificador (plateId) es obligatorio.");
      return;
    }
    if (!cleanName) {
      setFormError("El nombre de la receta es obligatorio.");
      return;
    }
    if (items.length === 0) {
      setFormError("Debes incluir al menos un insumo en la receta.");
      return;
    }

    const selectedIds = new Set();
    const formattedItems = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.itemId) {
        setFormError(`Fila ${i + 1}: Selecciona un insumo.`);
        return;
      }
      if (selectedIds.has(row.itemId)) {
        setFormError(
          `El mismo insumo no puede seleccionarse más de una vez en la receta.`,
        );
        return;
      }
      selectedIds.add(row.itemId);

      const qty = parseFloat(row.requiredQuantity);
      if (isNaN(qty) || qty < MIN_REQUIRED_QUANTITY) {
        setFormError(
          `Fila ${i + 1}: La cantidad debe ser un número mayor o igual a ${MIN_REQUIRED_QUANTITY}.`,
        );
        return;
      }

      formattedItems.push({
        itemId: row.itemId,
        requiredQuantity: qty,
      });
    }

    const payload = {
      plateId: cleanPlateId,
      name: cleanName,
      items: formattedItems,
    };

    try {
      await onSave(payload, recipeToEdit ? recipeToEdit.id : undefined);
      onClose();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Error al guardar la receta.";
      setFormError(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={recipeToEdit ? "Editar Receta" : "Nueva Receta"}
      maxWidth="680px"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "16px" }}
      >
        {formError && (
          <div
            style={{
              padding: "10px 14px",
              backgroundColor: "var(--bg-danger)",
              color: "var(--color-danger)",
              borderRadius: "var(--radius-control)",
              fontSize: "var(--small-size)",
              fontWeight: 500,
            }}
          >
            {formError}
          </div>
        )}

        {/* Campos Principales */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 2fr",
            gap: "14px",
          }}
        >
          <Input
            label="Código (plateId)"
            id="recipe-plate-id"
            placeholder="Ej. PLATE-BURGER-01"
            value={plateId}
            onChange={(e) => setPlateId(e.target.value)}
            required
            helperText="Identificador único del platillo"
          />

          <Input
            label="Nombre del platillo"
            id="recipe-name"
            placeholder="Ej. Hamburguesa Clásica"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Editor de Insumos */}
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label
              style={{
                fontSize: "var(--small-size)",
                fontWeight: 600,
                color: "var(--color-ink)",
              }}
            >
              Insumos requeridos por porción: <span style={{ color: "var(--color-danger)" }}>*</span>
            </label>

            <span
              style={{
                fontSize: "var(--caption-size)",
                color: "var(--color-muted)",
              }}
            >
              {items.length} {items.length === 1 ? "insumo" : "insumos"}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxHeight: "280px",
              overflowY: "auto",
              paddingRight: "4px",
            }}
          >
            {items.map((item, idx) => {
              // Buscar insumo seleccionado para obtener su unidad de medida
              const selectedItem = availableItems.find(
                (itemOption) => itemOption.id === item.itemId,
              );
              const unit = selectedItem?.unit || "";

              return (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 140px 40px",
                    gap: "8px",
                    alignItems: "center",
                    backgroundColor: "var(--color-canvas)",
                    padding: "8px 10px",
                    borderRadius: "var(--radius-control)",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  {/* Selector de Insumo */}
                  <select
                    value={item.itemId}
                    onChange={(e) =>
                      handleItemChange(idx, "itemId", e.target.value)
                    }
                    disabled={loadingItems || saving}
                    required
                    style={{
                      height: "var(--control-height)",
                      padding: "0 10px",
                      borderRadius: "var(--radius-control)",
                      border: "1px solid var(--color-border)",
                      backgroundColor: "#FFFFFF",
                      fontSize: "var(--small-size)",
                      color: "var(--color-text)",
                      fontFamily: "inherit",
                      outline: "none",
                    }}
                  >
                    <option value="">-- Seleccionar insumo --</option>
                    {availableItems.map((itemOption) => (
                      <option key={itemOption.id} value={itemOption.id}>
                        {itemOption.name} ({itemOption.unit})
                      </option>
                    ))}
                  </select>

                  {/* Campo de Cantidad con Unidad Fija Bloqueada */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      height: "var(--control-height)",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-control)",
                      backgroundColor: "#FFFFFF",
                      overflow: "hidden",
                    }}
                  >
                    <input
                      type="number"
                      step="0.0001"
                      min={MIN_REQUIRED_QUANTITY}
                      placeholder="0.0001"
                      value={item.requiredQuantity}
                      onChange={(e) =>
                        handleItemChange(
                          idx,
                          "requiredQuantity",
                          e.target.value,
                        )
                      }
                      disabled={saving}
                      required
                      style={{
                        width: "100%",
                        height: "100%",
                        padding: "0 8px",
                        border: "none",
                        outline: "none",
                        fontSize: "var(--small-size)",
                        color: "var(--color-ink)",
                        fontFamily: "inherit",
                        boxSizing: "border-box",
                      }}
                    />
                    {unit && (
                      <span
                        style={{
                          backgroundColor: "var(--color-canvas)",
                          padding: "0 8px",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-muted)",
                          borderLeft: "1px solid var(--color-border)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {unit}
                      </span>
                    )}
                  </div>

                  {/* Botón Eliminar Fila */}
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length <= 1 || saving}
                    title="Eliminar insumo"
                    style={{
                      height: "var(--control-height)",
                      width: "36px",
                      borderRadius: "var(--radius-control)",
                      border: "none",
                      backgroundColor: "transparent",
                      color:
                        items.length <= 1
                          ? "var(--color-muted)"
                          : "var(--color-danger)",
                      cursor: items.length <= 1 ? "not-allowed" : "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: items.length <= 1 ? 0.4 : 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          {/* Botón Agregar Insumo */}
          <button
            type="button"
            onClick={handleAddItem}
            disabled={loadingItems || saving}
            style={{
              marginTop: "8px",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              color: "var(--color-primary)",
              fontSize: "var(--small-size)",
              fontWeight: 600,
              cursor: "pointer",
              padding: "4px 0",
            }}
          >
            <PlusIcon size={14} />
            <span>Agregar insumo</span>
          </button>
        </div>

        {/* Acciones */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "12px",
          }}
        >
          <Button
            variant="tertiary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>

          <Button
            variant="primary"
            type="submit"
            disabled={saving || loadingItems}
          >
            {saving
              ? "Guardando..."
              : recipeToEdit
                ? "Actualizar receta"
                : "Guardar receta"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
