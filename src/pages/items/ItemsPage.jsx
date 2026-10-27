import { useMemo, useState } from "react";
import { useItems } from "./hooks/useItems.js";
import { useColumnCount } from "./hooks/useColumnCount.js";
import { ItemsToolbar } from "./components/ItemsToolbar.jsx";
import { ItemCard } from "./components/ItemCard.jsx";
import { ItemsEmptyState } from "./components/ItemsEmptyState.jsx";
import { ItemFormModal } from "./components/ItemFormModal.jsx";
import { formFromItem, emptyForm } from "./constants.js";

export function ItemsPage() {
  const {
    suppliers,
    categories,
    filteredItems,
    filters,
    updateFilters,
    loading,
    saving,
    error,
    message,
    clearMessage,
    save,
    remove,
  } = useItems();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [expandedItems, setExpandedItems] = useState({});
  const columnCount = useColumnCount();

  const toggleItem = (itemId) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const suppliersById = useMemo(
    () => new Map(suppliers.map((supplier) => [supplier.id, supplier])),
    [suppliers],
  );

  /**
   * Reparto fijo de las cards en columnas: la N-esima card va siempre a la
   * columna N % columnas. Al expandir una card solo se empujan hacia abajo
   * las de su propia columna; las demás no se mueven.
   */
  const columnas = useMemo(() => {
    const buckets = Array.from({ length: columnCount }, () => []);

    filteredItems.forEach((item, index) => {
      buckets[index % columnCount].push(item);
    });

    return buckets;
  }, [filteredItems, columnCount]);

  const openCreate = () => {
    clearMessage();
    setForm(emptyForm(suppliers));
    setModalOpen(true);
  };

  const openEdit = (item) => {
    clearMessage();
    setForm(formFromItem(item, suppliers));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyForm(suppliers));
    clearMessage();
  };

  const handleFieldChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const submitForm = async (event) => {
    event.preventDefault();
    try {
      await save({
        id: form.id || undefined,
        sku: form.sku.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        unit: form.unit,
        minStock: Number(form.minStock),
        category: form.category.trim(),
        isPerishable: Boolean(form.isPerishable),
        storageCondition: form.storageCondition,
        supplierIdSugested: form.supplierIdSugested || null,
      });
      setModalOpen(false);
      setForm(emptyForm(suppliers));
    } catch {
      // El hook expone el error para mostrarlo en el modal.
    }
  };

  const confirmDelete = async (item) => {
    if (
      !window.confirm(`¿Eliminar el insumo "${item.name}" del catálogo?`)
    )
      return;
    try {
      await remove(item.id);
    } catch {
      // El hook expone el error en el banner.
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

      <ItemsToolbar
        search={filters.search}
        category={filters.category}
        categories={categories}
        onSearch={(value) => updateFilters({ search: value })}
        onCategoryChange={(value) => updateFilters({ category: value })}
        onNew={openCreate}
        disabled={loading}
      />

      {loading && filteredItems.length === 0 ? (
        <ItemsEmptyState loading />
      ) : filteredItems.length === 0 ? (
        <ItemsEmptyState />
      ) : (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "20px",
          }}
        >
          {columnas.map((columna, indiceColumna) => (
            <div
              key={indiceColumna}
              style={{
                flex: "1 1 0",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {columna.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  supplier={
                    item.supplierSugested ||
                    suppliersById.get(item.supplierIdSugested) ||
                    null
                  }
                  expanded={Boolean(expandedItems[item.id])}
                  onToggleExpand={() => toggleItem(item.id)}
                  onEdit={() => openEdit(item)}
                  onDelete={() => confirmDelete(item)}
                  disabled={saving}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <ItemFormModal
        isOpen={modalOpen}
        values={form}
        suppliers={suppliers}
        error={error || ""}
        saving={saving}
        onChange={handleFieldChange}
        onClose={closeModal}
        onSubmit={submitForm}
      />
    </div>
  );
}

export default ItemsPage;
