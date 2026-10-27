import { useState } from "react";
import { useRecipes } from "./hooks/useRecipes";
import { RecipesToolbar } from "./components/RecipesToolbar.jsx";
import { RecipeCard } from "./components/RecipeCard.jsx";
import { RecipeDetailModal } from "./components/RecipeDetailModal.jsx";
import { RecipeFormModal } from "./components/RecipeFormModal.jsx";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal.jsx";
import { RecipesEmptyState } from "./components/RecipesEmptyState.jsx";
export function RecetasPage() {
  const {
    filteredRecipes,
    availableItems,
    filters,
    updateFilters,
    loading,
    loadingItems,
    saving,
    error,
    message,
    clearMessage,
    save,
    remove,
  } = useRecipes();

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [recipeToEdit, setRecipeToEdit] = useState(null);
  const [recipeToView, setRecipeToView] = useState(null);
  const [recipeToDelete, setRecipeToDelete] = useState(null);

  const handleOpenCreate = () => {
    setRecipeToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (recipe) => {
    setRecipeToEdit(recipe);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setRecipeToEdit(null);
  };

  const handleSaveRecipe = async (input, editingId) => {
    await save(input, editingId);
  };

  const handleConfirmDelete = async () => {
    if (!recipeToDelete) return;
    try {
      await remove(recipeToDelete.id || recipeToDelete.plateId);
      setRecipeToDelete(null);
    } catch {
      // El error se gestiona dentro de useRecipes
    }
  };

  const hasSearchOrFilter =
    Boolean(filters.search.trim()) || filters.availability !== "ALL";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Banner de Mensaje de Éxito */}
      {message && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-control)",
            backgroundColor: "var(--bg-success)",
            color: "var(--color-success)",
            fontSize: "var(--small-size)",
            fontWeight: 500,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "var(--shadow-flat)",
          }}
        >
          <span>{message}</span>
          <button
            type="button"
            onClick={clearMessage}
            style={{
              background: "none",
              border: "none",
              color: "currentColor",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Banner de Error */}
      {error && (
        <div
          style={{
            padding: "12px 16px",
            borderRadius: "var(--radius-control)",
            backgroundColor: "var(--bg-danger)",
            color: "var(--color-danger)",
            fontSize: "var(--small-size)",
            fontWeight: 500,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "var(--shadow-flat)",
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearMessage}
            style={{
              background: "none",
              border: "none",
              color: "currentColor",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "16px",
              padding: "0 4px",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Barra de Búsqueda, Filtros y Creación */}
      <RecipesToolbar
        search={filters.search}
        onSearchChange={(search) => updateFilters({ search })}
        availability={filters.availability}
        onAvailabilityChange={(availability) =>
          updateFilters({ availability })
        }
        onNewRecipe={handleOpenCreate}
        loadingItems={loadingItems}
      />

      {/* Contenido Principal */}
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "200px",
            color: "var(--color-muted)",
            fontSize: "var(--small-size)",
          }}
        >
          <span>Cargando catálogo de recetas y calculando porciones...</span>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <RecipesEmptyState
          hasSearchOrFilter={hasSearchOrFilter}
          onResetFilters={() =>
            updateFilters({ search: "", availability: "ALL" })
          }
          onNewRecipe={handleOpenCreate}
        />
      ) : (
        <div className="grid-responsive">
          {filteredRecipes.map((recipe) => (
            <RecipeCard
              key={recipe.id || recipe.plateId}
              recipe={recipe}
              onViewDetail={(r) => setRecipeToView(r)}
              onEdit={handleOpenEdit}
              onDelete={(r) => setRecipeToDelete(r)}
            />
          ))}
        </div>
      )}

      {/* Modal Detalle de Receta (Solo Lectura) */}
      <RecipeDetailModal
        recipe={recipeToView}
        isOpen={Boolean(recipeToView)}
        onClose={() => setRecipeToView(null)}
      />

      {/* Modal Formulario de Creación / Edición */}
      {isFormOpen && (
        <RecipeFormModal
          key={
            recipeToEdit ? recipeToEdit.id || recipeToEdit.plateId : "new-recipe"
          }
          isOpen={isFormOpen}
          onClose={handleCloseForm}
          recipeToEdit={recipeToEdit}
          availableItems={availableItems}
          loadingItems={loadingItems}
          onSave={handleSaveRecipe}
          saving={saving}
        />
      )}

      {/* Modal de Confirmación de Eliminación */}
      <ConfirmDeleteModal
        isOpen={Boolean(recipeToDelete)}
        onClose={() => setRecipeToDelete(null)}
        onConfirm={handleConfirmDelete}
        recipe={recipeToDelete}
        loading={saving}
      />
    </div>
  );
}
