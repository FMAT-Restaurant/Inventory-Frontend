import { useMemo, useState } from "react";
import { useIngredients } from "./hooks/useIngredients.js";
import { useColumnCount } from "./hooks/useColumnCount.js";
import { IngredientsToolbar } from "./components/IngredientsToolbar.jsx";
import { IngredientCard } from "./components/IngredientCard.jsx";
import { IngredientsEmptyState } from "./components/IngredientsEmptyState.jsx";
import { IngredientFormModal } from "./components/IngredientFormModal.jsx";
import { formFromIngredients, emptyForm } from "./constants.js";

export function IngredientesPage() {
  const {
    suppliers,
    categories,
    filteredIngredients,
    filters,
    updateFilters,
    loading,
    saving,
    error,
    message,
    clearMessage,
    save,
    remove,
  } = useIngredients();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [expandedIngredients, setExpandedIngredients] = useState({});
  const columnCount = useColumnCount();

  const toggleIngredient = (ingredientId) => {
    setExpandedIngredients((prev) => ({
      ...prev,
      [ingredientId]: !prev[ingredientId],
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

    filteredIngredients.forEach((ingredient, index) => {
      buckets[index % columnCount].push(ingredient);
    });

    return buckets;
  }, [filteredIngredients, columnCount]);

  const openCreate = () => {
    clearMessage();
    setForm(emptyForm(suppliers));
    setModalOpen(true);
  };

  const openEdit = (ingredient) => {
    clearMessage();
    setForm(formFromIngredients(ingredient, suppliers));
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

  const confirmDelete = async (ingredient) => {
    if (
      !window.confirm(
        `¿Eliminar el ingrediente "${ingredient.name}" del catálogo?`,
      )
    )
      return;
    try {
      await remove(ingredient.id);
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

      <IngredientsToolbar
        search={filters.search}
        category={filters.category}
        categories={categories}
        onSearch={(value) => updateFilters({ search: value })}
        onCategoryChange={(value) => updateFilters({ category: value })}
        onNew={openCreate}
        disabled={loading}
      />

      {loading && filteredIngredients.length === 0 ? (
        <IngredientsEmptyState loading />
      ) : filteredIngredients.length === 0 ? (
        <IngredientsEmptyState />
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
              {columna.map((ingredient) => (
                <IngredientCard
                  key={ingredient.id}
                  ingredient={ingredient}
                  supplier={
                    ingredient.supplierSugested ||
                    suppliersById.get(ingredient.supplierIdSugested) ||
                    null
                  }
                  expanded={Boolean(expandedIngredients[ingredient.id])}
                  onToggleExpand={() => toggleIngredient(ingredient.id)}
                  onEdit={() => openEdit(ingredient)}
                  onDelete={() => confirmDelete(ingredient)}
                  disabled={saving}
                />
              ))}
            </div>
          ))}
        </div>
      )}

      <IngredientFormModal
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
