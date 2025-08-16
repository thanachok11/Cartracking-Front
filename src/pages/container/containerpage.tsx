import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/pages/ContainerPage.css';
import { fetchAllContainers, createContainer, updateContainer, deleteContainer, isContainerNumberUnique, APIError, CONTAINER_SIZES, Containers as ApiContainers } from '../../api/components/containersApi';
import { Containers } from './components/types';
import { validateForm, ensureTrim } from './components/utils';
import ContainerHeader from './components/ContainerHeader';
import SearchFilterBar from './components/SearchFilterBar';
import ErrorBanner from './components/ErrorBanner';
import DiagnosticBanner from './components/DiagnosticBanner';
import ContainerGrid from './components/ContainerGrid';
import ContainerModal from './components/ContainerModal';

export default function ContainerPage() {
  const [containers, setContainers] = useState<Containers[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState<Containers | null>(null);
  const [saving, setSaving] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [formData, setFormData] = useState<Omit<Containers, '_id'>>({ containerNumber: '', companyName: '', containerSize: '' });

  const filteredContainers = useMemo(
    () =>
      containers.filter((c) => {
        const containerNumber = c?.containerNumber || '';
        const companyName = c?.companyName || '';
        const searchMatch = containerNumber.toLowerCase().includes(searchTerm.toLowerCase()) || companyName.toLowerCase().includes(searchTerm.toLowerCase());
        let categoryMatch = true;
        if (filterBy === 'ป๋อเฉิน') categoryMatch = companyName.includes('ป๋อเฉิน');
        else if (filterBy === 'รถร่วม') categoryMatch = companyName.includes('รถร่วม');
        return searchMatch && categoryMatch;
      }),
    [containers, searchTerm, filterBy]
  );

  const loadContainers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllContainers();
      setContainers(data as ApiContainers[]);
      setError(null);
    } catch (err) {
      console.error('Load containers error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingContainer(null);
    setError(null);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      const val = validateForm(formData);
      if (val) return setError(val);

      const isUnique = await isContainerNumberUnique(ensureTrim(formData.containerNumber!));
      if (!isUnique) return setError('Container Number already exists');

      await createContainer({ ...formData, containerNumber: ensureTrim(formData.containerNumber) });
      await loadContainers();
      handleCloseModal();
    } catch (err) {
      setError(err instanceof APIError ? err.message : 'Failed to create container');
    } finally {
      setSaving(false);
    }
  }, [formData, loadContainers, handleCloseModal]);

  const handleUpdate = useCallback(async () => {
    if (!editingContainer) return;
    try {
      setSaving(true);
      setError(null);

      const val = validateForm(formData);
      if (val) return setError(val);

      if (formData.containerNumber !== editingContainer.containerNumber) {
        const isUnique = await isContainerNumberUnique(ensureTrim(formData.containerNumber!), editingContainer._id);
        if (!isUnique) return setError('Container Number already exists');
      }

      await updateContainer(editingContainer._id!, { ...formData, containerNumber: ensureTrim(formData.containerNumber) });
      await loadContainers();
      handleCloseModal();
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to update container';
      setError(`Update failed: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  }, [editingContainer, formData, loadContainers, handleCloseModal]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this container?')) return;
    try {
      await deleteContainer(id);
      await loadContainers();
    } catch (err) {
      setError(err instanceof APIError ? err.message : 'Failed to delete container');
    }
  }, [loadContainers]);

  const handleOpenModal = useCallback((container?: Containers) => {
    if (container) {
      setEditingContainer(container);
      setFormData({ containerNumber: container.containerNumber || '', companyName: container.companyName || '', containerSize: container.containerSize || '' });
    } else {
      setEditingContainer(null);
      setFormData({ containerNumber: '', companyName: '', containerSize: '' });
    }
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    const val = validateForm(formData);
    if (val) return setError(val);
    editingContainer ? handleUpdate() : handleCreate();
  }, [editingContainer, handleUpdate, handleCreate, formData]);

  useEffect(() => {
    loadContainers();
  }, [loadContainers]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="container-page">
      <ContainerHeader onAdd={() => handleOpenModal()} />

      <SearchFilterBar
        searchTerm={searchTerm}
        filterBy={filterBy}
        onSearch={setSearchTerm}
        onFilter={setFilterBy}
        resultsCount={filteredContainers.length}
      />

      {error && (
        <ErrorBanner message={error} onRetry={() => { setError(null); loadContainers(); }} onDismiss={() => setError(null)} />
      )}

      {showDiagnostic && <DiagnosticBanner onClose={() => setShowDiagnostic(false)} />}

      <ContainerGrid items={filteredContainers} onEdit={handleOpenModal} onDelete={handleDelete} />

      <ContainerModal
        visible={showModal}
        editing={editingContainer}
        error={error}
        saving={saving}
        form={formData}
        sizes={CONTAINER_SIZES}
        onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        onClose={handleCloseModal}
        onSave={handleSave}
      />
    </div>
  );
}
