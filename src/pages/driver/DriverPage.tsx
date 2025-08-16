import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../../styles/pages/DriverPage.css';
import { fetchAllDrivers, createDriver, updateDriver, deleteDriver, Driver } from '../../api/components/driversApi';
import ErrorBanner from './components/ErrorBanner';
import DriverHeader from './components/DriverHeader';
import SearchFilterBar from './components/SearchFilterBar';
import DriverGrid from './components/DriverGrid';
import DriverModal from './components/DriverModal';

export default function DriverPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [filterBy, setFilterBy] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [saving, setSaving] = useState(false);

  // เก็บค่าฟอร์ม (ไม่รวม _id)
  const [formData, setFormData] = useState<Omit<Driver, '_id'>>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    position: '',
    company: '',
    detail: '',
    profile_img: ''
  });

  // 👉 เพิ่ม state สำหรับไฟล์
  const [file, setFile] = useState<File | null>(null);

  const handleApiError = (error: any, defaultMessage: string) => {
    if (error?.response && (error.response.status === 401 || error.response.status === 403)) {
      setError(`ไม่มีสิทธิ์เข้าถึงข้อมูล (${error.response.status}) - กรุณาตรวจสอบการเข้าสู่ระบบ`);
      return;
    }
    if (!error?.response || error.response.status >= 500) {
      setError(`เซิร์ฟเวอร์ไม่พร้อมใช้งาน (${error.response?.status || 'Network Error'}) - กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ`);
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
      const searchMatch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        position.toLowerCase().includes(searchTerm.toLowerCase());
      let categoryMatch = true;
      if (filterBy === 'po-chern') categoryMatch = company.includes('ป๋อเฉิน');
      else if (filterBy === 'rot-ruam') categoryMatch = company.includes('รถร่วม');
      else if (filterBy === 'driver') categoryMatch = position.toLowerCase().includes('driver') || position.toLowerCase().includes('คนขับ');
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
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setEditingDriver(null);
    setError(null);
    setFile(null); // reset file ทุกครั้งที่ปิด modal
  }, []);

  const handleCreate = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      await createDriver(formData, file || undefined); // ✅ ส่ง file ไปด้วย
      await loadDrivers();
      handleCloseModal();
    } catch (error) {
      handleApiError(error, 'เกิดข้อผิดพลาดในการสร้างข้อมูลคนขับ');
    } finally {
      setSaving(false);
    }
  }, [formData, file, loadDrivers, handleCloseModal]);

  const handleUpdate = useCallback(async () => {
    if (!editingDriver) return;
    try {
      setSaving(true);
      setError(null);
      await updateDriver(editingDriver._id!, formData, file || undefined); // ✅ ส่ง file ไปด้วย
      await loadDrivers();
      handleCloseModal();
    } catch (error) {
      handleApiError(error, 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลคนขับ');
    } finally {
      setSaving(false);
    }
  }, [editingDriver, formData, file, loadDrivers, handleCloseModal]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบคนขับคนนี้?')) return;
    try {
      await deleteDriver(id);
      await loadDrivers();
    } catch (error) {
      handleApiError(error, 'เกิดข้อผิดพลาดในการลบข้อมูลคนขับ');
    }
  }, [loadDrivers]);

  const handleOpenModal = useCallback((driver?: Driver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        firstName: driver.firstName || '',
        lastName: driver.lastName || '',
        phoneNumber: driver.phoneNumber || '',
        position: driver.position || '',
        company: driver.company || '',
        detail: driver.detail || '',
        profile_img: driver.profile_img || ''
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
        profile_img: ''
      });
    }
    setFile(null); // reset file ตอนเปิด modal
    setShowModal(true);
  }, []);

  const handleSave = useCallback(() => {
    editingDriver ? handleUpdate() : handleCreate();
  }, [editingDriver, handleUpdate, handleCreate]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  if (loading) return <div className="loading">Loading Driver Data...</div>;

  if (error) {
    return (
      <div className="driver-page">
        <DriverHeader onRefresh={() => { }} onAdd={() => { }} />
        <ErrorBanner message={error} onRetry={() => loadDrivers()} />
      </div>
    );
  }

  return (
    <div className="driver-page">
      <DriverHeader onRefresh={loadDrivers} onAdd={() => handleOpenModal()} />

      <SearchFilterBar
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
        onFileChange={setFile} // ✅ ส่ง callback สำหรับเลือกไฟล์ไปที่ modal
      />
    </div>
  );
}
