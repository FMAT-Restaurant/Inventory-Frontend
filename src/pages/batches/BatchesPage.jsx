import { useState } from "react";
import { useBatches } from "./hooks/useBatches.js";
import { BatchesToolbar } from "./components/BatchesToolbar.jsx";
import { BatchItemCard } from "./components/BatchItemCard.jsx";
import { BatchesEmptyState } from "./components/BatchesEmptyState.jsx";
import { BatchFormModal } from "./components/BatchFormModal.jsx";
import { ConfirmModal } from "../../components/ui/ConfirmModal.jsx";
import { emptyBatchForm, formFromBatch } from "./constants.js";

export function BatchesPage({ preselectedItemId }) {
  const {
    items,
    batchesByItemId,
    suppliers,
    filteredItems,
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

  const toggleExpand = (itemId) => {
    setExpandedBatches((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  // Botón general "Registrar compra": permite elegir cualquier insumo
  const openCreateGeneral = () => {
    clearMessage();
    setForm(emptyBatchForm(suppliers, items, preselectedItemId || ""));
    setModalOpen(true);
  };

  // Botón "+ Comprar" de un insumo específico: bloquea ese insumo
  const openCreateForItem = (itemId) => {
    clearMessage();
    setForm(emptyBatchForm(suppliers, items, itemId));
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
    setForm(emptyBatchForm(suppliers, items));
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
        const targetItemId = form.itemId || items[0]?.id || "";
        await createBatch({
          batchNumber: form.batchNumber?.trim() || undefined,
          itemId: targetItemId,
          supplierId: form.supplierId || null,
          quantity: Number(form.quantity),
          cost: Number(form.cost),
          expirationDate: form.expirationDate,
        });
        // Expandir automáticamente los lotes del insumo al que se le registró compra
        if (targetItemId) {
          setExpandedBatches((prev) => ({
            ...prev,
            [targetItemId]: true,
          }));
        }
      }
      setModalOpen(false);
      setForm(emptyBatchForm(suppliers, items));
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

      {loading && filteredItems.length === 0 ? (
        <BatchesEmptyState loading />
      ) : filteredItems.length === 0 ? (
        <BatchesEmptyState />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredItems.map((item) => {
            const itemBatches =
              batchesByItemId.get(item.id) ?? [];
            const isExpanded = Boolean(expandedBatches[item.id]);

            return (
              <BatchItemCard
                key={item.id}
                item={item}
                batches={itemBatches}
                expanded={isExpanded}
                onToggleExpand={() => toggleExpand(item.id)}
                onNewPurchase={() => openCreateForItem(item.id)}
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
        items={items}
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
