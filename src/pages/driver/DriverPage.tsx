import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/pages/DriverPage.css';
import {
  fetchAllDrivers,
  createDriver,
  updateDriver,
  deleteDriver,
  Driver,
  createDriverWithImage,
  updateDriverWithImage,
} from '../../api/components/driversApi';
import ErrorBanner from './components/ErrorBanner';
import DriverHeader from './components/DriverHeader';
import DriverGrid from './components/DriverGrid';
import DriverModal from './components/DriverModal';
import NotificationToast from '../../components/common/NotificationToast';
import { useNotification } from '../../hooks/useNotification';
import '../../styles/components/NotificationToast.css';
import { useI18n } from '../../i18n';

export default function DriverPage() {
  const { t } = useI18n();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Omit<Driver, '_id'>>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    position: '',
    company: '',
    detail: '',
    profile_img: '',
  });

  const [imageFile, setImageFile] = useState<File | null>(null);

  // notification hook
  const { 
    notification, 
    progress, 
    showNotification, 
    handleMouseEnter, 
    handleMouseLeave 
  } = useNotification();

  const handleApiError = (error: any, defaultMessage: string) => {
    if (error?.response && (error.response.status === 401 || error.response.status === 403)) {
      setError(`${t('protected.denied')} (${error.response.status})`);
      return;
    }
    if (!error?.response || error.response.status >= 500) {
      setError(`Server unavailable (${error.response?.status || 'Network Error'})`);
      return;
    }
    const errorMsg = error?.response?.data?.message || error?.message || defaultMessage;
    setError(`${defaultMessage} (${error.response?.status}): ${errorMsg}`);
  };

  const filteredDrivers = useMemo(() => {
    return drivers.filter((driver) => {
      const fullName = `${driver?.firstName || ''} ${driver?.lastName || ''}`;
      const company = driver?.company || '';
      const position = driver?.position || '';
      const searchMatch =
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.toLowerCase().includes(searchTerm.toLowerCase());
      let categoryMatch = true;
      if (filterBy === 'po-chern') categoryMatch = company.includes('ป๋อเฉิน');
      else if (filterBy === 'rot-ruam') categoryMatch = company.includes('รถร่วม');
      else if (filterBy === 'driver')
        categoryMatch =
          position.toLowerCase().includes('driver') || position.toLowerCase().includes('คนขับ');
      return searchMatch && categoryMatch;
    });
  }, [drivers, searchTerm, filterBy]);

  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAllDrivers();
      setDrivers(data || []);
    } catch (err: any) {
      handleApiError(err, 'ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาลองใหม่อีกครั้ง');
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingDriver(null);
    setError(null);
    setImageFile(null);
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);

      if (imageFile) {
        await createDriverWithImage(formData, imageFile);
      } else {
        await createDriver(formData);
      }

      await loadDrivers();
      handleCloseModal();
      showNotification(`${t('drivers.add')} ✅`, "success");
    } catch (error) {
      handleApiError(error, 'Create driver failed');
      showNotification(`${t('common.noData')} ❌`, "error");
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, imageFile, loadDrivers, handleCloseModal]);

  const handleUpdate = useCallback(async () => {
    if (!editingDriver) return;
    try {
      setSaving(true);
      setError(null);

      if (imageFile) {
        await updateDriverWithImage(editingDriver._id!, formData, imageFile);
      } else {
        await updateDriver(editingDriver._id!, formData);
      }

      await loadDrivers();
      handleCloseModal();
      showNotification(`${t('common.save')} ✅`, "success");  
    } catch (error) {
      handleApiError(error, 'Update driver failed');
      showNotification(`${t('common.noData')} ❌`, "error");
    } finally {
      setSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingDriver, formData, imageFile, loadDrivers, handleCloseModal]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(`${t('common.delete')}?`)) return;
      try {
        await deleteDriver(id);
        await loadDrivers();
        showNotification(`${t('common.delete')} ✅`, "success");
      } catch (error) {
        handleApiError(error, 'Delete driver failed');
        showNotification(`${t('common.noData')} ❌`, "error");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loadDrivers]
  );

  const handleOpenModal = useCallback((driver?: Driver) => {
    setImageFile(null);
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        firstName: driver.firstName || '',
        lastName: driver.lastName || '',
        phoneNumber: driver.phoneNumber || '',
        position: driver.position || '',
        company: driver.company || '',
        detail: driver.detail || '',
        profile_img: driver.profile_img || '',
      });
    } else {
      setEditingDriver(null);
      setFormData({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        position: '',
        company: '',
        detail: '',
        profile_img: '',
      });
    }
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    editingDriver ? handleUpdate() : handleCreate();
  }, [editingDriver, handleUpdate, handleCreate]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  if (loading) return <div className="loading">{t('common.loading')}</div>;

  if (error) {
    return (
      <div className="driver-page">
        <DriverHeader
          onRefresh={loadDrivers}
          onAdd={() => handleOpenModal()}
          totalCount={drivers.length}
          searchTerm={searchTerm}
          filterBy={filterBy}
          onSearch={setSearchTerm}
          onFilter={setFilterBy}
          resultsCount={filteredDrivers.length}
        />
        <ErrorBanner message={error} onRetry={() => loadDrivers()} />
      </div>
    );
  }

  return (
    <div className="driver-page">
      <DriverHeader
        onRefresh={loadDrivers}
        onAdd={() => handleOpenModal()}
        totalCount={drivers.length}
        searchTerm={searchTerm}
        filterBy={filterBy}
        onSearch={setSearchTerm}
        onFilter={setFilterBy}
        resultsCount={filteredDrivers.length}
      />

      <DriverGrid items={filteredDrivers} onEdit={handleOpenModal} onDelete={handleDelete} />

      <DriverModal
        visible={showModal}
        editing={editingDriver}
        error={error}
        saving={saving}
        form={formData}
        onChange={(patch) => setFormData((prev) => ({ ...prev, ...patch }))}
        onClose={handleCloseModal}
        onSave={handleSave}
        imageFile={imageFile}
        onImageFileChange={setImageFile}
      />

      <NotificationToast
        message={notification?.message}
        type={notification?.type}
        progress={progress}
        isHovering={false}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
