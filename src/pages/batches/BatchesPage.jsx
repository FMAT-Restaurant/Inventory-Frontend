import { useState } from "react";
import { useBatches } from "./hooks/useBatches.js";
import { BatchesToolbar } from "./components/BatchesToolbar.jsx";
import { BatchIngredientCard } from "./components/BatchIngredientCard.jsx";
import { BatchesEmptyState } from "./components/BatchesEmptyState.jsx";
import { BatchFormModal } from "./components/BatchFormModal.jsx";
import { ConfirmModal } from "../../components/ui/ConfirmModal.jsx";
import { emptyBatchForm, formFromBatch } from "./constants.js";

export function BatchesPage({ preselectedIngredientId }) {
  const {
    ingredients,
    batchesByIngredientId,
    suppliers,
    filteredIngredients,
    filters,
    updateFilters,
    loading,
    saving,
    error,
    message,
    clearMessage,
    createBatch,
    updateBatch,
    removeBatch,
  } = useBatches();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyBatchForm());
  const [expandedBatches, setExpandedBatches] = useState({});
  const [batchToDelete, setBatchToDelete] = useState(null);

  const toggleExpand = (ingredientId) => {
    setExpandedBatches((prev) => ({
      ...prev,
      [ingredientId]: !prev[ingredientId],
    }));
  };

  // Botón general "Registrar compra": permite elegir cualquier ingrediente
  const openCreateGeneral = () => {
    clearMessage();
    setForm(
      emptyBatchForm(suppliers, ingredients, preselectedIngredientId || ""),
    );
    setModalOpen(true);
  };

  // Botón "+ Comprar" de un ingrediente específico: bloquea ese ingrediente
  const openCreateForIngredient = (ingredientId) => {
    clearMessage();
    setForm(emptyBatchForm(suppliers, ingredients, ingredientId));
    setModalOpen(true);
  };

  const openEditBatch = (batch) => {
    clearMessage();
    setForm(formFromBatch(batch, suppliers));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyBatchForm(suppliers, ingredients));
    clearMessage();
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      if (form.id) {
        await updateBatch(form.id, {
          quantity: Number(form.quantity),
          cost: Number(form.cost),
          expirationDate: form.expirationDate,
        });
      } else {
        const targetIngredientId =
          form.ingredientId || ingredients[0]?.id || "";
        await createBatch({
          batchNumber: form.batchNumber?.trim() || undefined,
          ingredientId: targetIngredientId,
          supplierId: form.supplierId || null,
          quantity: Number(form.quantity),
          cost: Number(form.cost),
          expirationDate: form.expirationDate,
        });
        // Expandir automáticamente los lotes del ingrediente al que se le registró compra
        if (targetIngredientId) {
          setExpandedBatches((prev) => ({
            ...prev,
            [targetIngredientId]: true,
          }));
        }
      }
      setModalOpen(false);
      setForm(emptyBatchForm(suppliers, ingredients));
    } catch {
      // El hook expone el error para mostrarlo en el modal.
    }
  };

  const requestDeleteBatch = (batch) => {
    clearMessage();
    setBatchToDelete(batch);
  };

  const closeDeleteModal = () => {
    if (saving) return;
    setBatchToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!batchToDelete) return;
    try {
      await removeBatch(batchToDelete.id);
    } catch {
      // El hook expone el error en el banner.
    } finally {
      setBatchToDelete(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {!modalOpen && (error || message) && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-control)",
            fontSize: "var(--small-size)",
            fontWeight: 500,
            backgroundColor: error ? "var(--bg-danger)" : "var(--bg-success)",
            color: error ? "var(--color-danger)" : "var(--color-success)",
          }}
        >
          {error || message}
        </div>
      )}

      <BatchesToolbar
        search={filters.search}
        statusFilter={filters.status}
        onSearch={(value) => updateFilters({ search: value })}
        onStatusChange={(value) => updateFilters({ status: value })}
        onNewPurchase={openCreateGeneral}
        disabled={loading}
      />

      {loading && filteredIngredients.length === 0 ? (
        <BatchesEmptyState loading />
      ) : filteredIngredients.length === 0 ? (
        <BatchesEmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredIngredients.map((ingredient) => {
            const ingredientBatches =
              batchesByIngredientId.get(ingredient.id) ?? [];
            const isExpanded = Boolean(expandedBatches[ingredient.id]);

            return (
              <BatchIngredientCard
                key={ingredient.id}
                ingredient={ingredient}
                batches={ingredientBatches}
                expanded={isExpanded}
                onToggleExpand={() => toggleExpand(ingredient.id)}
                onNewPurchase={() => openCreateForIngredient(ingredient.id)}
                onEditBatch={openEditBatch}
                onDeleteBatch={requestDeleteBatch}
                disabled={saving}
              />
            );
          })}
        </div>
      )}

      <BatchFormModal
        isOpen={modalOpen}
        values={form}
        ingredients={ingredients}
        suppliers={suppliers}
        error={error || ""}
        saving={saving}
        onChange={handleFieldChange}
        onClose={closeModal}
        onSubmit={submitForm}
      />

      <ConfirmModal
        isOpen={Boolean(batchToDelete)}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Eliminar Lote"
        message={
          batchToDelete
            ? `¿Estás seguro de que deseas eliminar el lote "${batchToDelete.batchNumber}" del inventario? Esta acción no se puede deshacer.`
            : ""
        }
        confirmLabel="Eliminar lote"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={saving}
      />
    </div>
  );
}
