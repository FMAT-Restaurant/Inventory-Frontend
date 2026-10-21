import { useState } from 'react';
import { useSuppliers } from './hooks/useSuppliers.js';
import { SuppliersToolbar } from './components/SuppliersToolbar.jsx';
import { SupplierCard } from './components/SupplierCard.jsx';
import { SuppliersEmptyState } from './components/SuppliersEmptyState.jsx';
import { SupplierFormModal } from './components/SupplierFormModal.jsx';
import { ConfirmModal } from '../../components/ui/ConfirmModal.jsx';
import { emptyForm, formFromSupplier } from './constants.js';

export function SuppliersPage() {
  const {
    filteredSuppliers,
    filters,
    updateFilters,
    loading,
    saving,
    error,
    message,
    clearMessage,
    save,
    remove,
  } = useSuppliers();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const openCreate = () => {
    clearMessage();
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (supplier) => {
    clearMessage();
    setForm(formFromSupplier(supplier));
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setForm(emptyForm());
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
        name: form.name.trim(),
        contactName: form.contactName.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
      });
      setModalOpen(false);
      setForm(emptyForm());
    } catch {
      // El hook expone el error para mostrarlo en el modal.
    }
  };

  const requestDelete = (supplier) => {
    clearMessage();
    setSupplierToDelete(supplier);
  };

  const closeDeleteModal = () => {
    if (saving) return;
    setSupplierToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await remove(supplierToDelete.id);
    } catch {
      // El hook expone el error en el banner.
    } finally {
      setSupplierToDelete(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!modalOpen && (error || message) && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-control)',
            fontSize: 'var(--small-size)',
            fontWeight: 500,
            backgroundColor: error ? 'var(--bg-danger)' : 'var(--bg-success)',
            color: error ? 'var(--color-danger)' : 'var(--color-success)',
          }}
        >
          {error || message}
        </div>
      )}

      <SuppliersToolbar
        search={filters.search}
        onSearch={(value) => updateFilters({ search: value })}
        onNew={openCreate}
        disabled={loading}
      />

      {loading && filteredSuppliers.length === 0 ? (
        <SuppliersEmptyState loading />
      ) : filteredSuppliers.length === 0 ? (
        <SuppliersEmptyState />
      ) : (
        <div className="grid-responsive">
          {filteredSuppliers.map((supplier) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={() => openEdit(supplier)}
              onDelete={() => requestDelete(supplier)}
              disabled={saving}
            />
          ))}
        </div>
      )}

      <SupplierFormModal
        isOpen={modalOpen}
        values={form}
        error={error || ''}
        saving={saving}
        onChange={handleFieldChange}
        onClose={closeModal}
        onSubmit={submitForm}
      />

      <ConfirmModal
        isOpen={Boolean(supplierToDelete)}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        title="Eliminar Proveedor"
        message={
          supplierToDelete
            ? `¿Estás seguro de que deseas eliminar al proveedor "${supplierToDelete.name}"? Esta acción no se puede deshacer.`
            : ''
        }
        confirmLabel="Eliminar proveedor"
        cancelLabel="Cancelar"
        variant="destructive"
        loading={saving}
      />
    </div>
  );
}