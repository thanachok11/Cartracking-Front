// src/pages/driver/DriverProfilePage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchAllDrivers, updateDriver, deleteDriver, type Driver } from '../../../api/components/driversApi';
import DriverModal from './DriverModal';

export default function DriverProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEdit, setShowEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Driver, '_id'>>({
    firstName: '', lastName: '', phoneNumber: '',
    position: '', company: '', detail: '', profile_img: ''
  });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const all = await fetchAllDrivers();
      const found = all.find((d) => d._id === id) ?? null;
      setDriver(found);
      if (found) {
        setForm({
          firstName: found.firstName || '',
          lastName: found.lastName || '',
          phoneNumber: found.phoneNumber || '',
          position: found.position || '',
          company: found.company || '',
          detail: found.detail || '',
          profile_img: found.profile_img || '',
        });
      }
    } catch (e: any) {
      setError(e?.message || 'โหลดข้อมูลโปรไฟล์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = useCallback(async () => {
    if (!driver?._id) return;
    try {
      setSaving(true);
      setError(null);
      await updateDriver(driver._id, form);
      await load();
      setShowEdit(false);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [driver?._id, form, load]);

  const handleDelete = useCallback(async () => {
    if (!driver?._id) return;
    const ok = window.confirm(`ยืนยันการลบคนขับ: ${driver.firstName} ${driver.lastName}?`);
    if (!ok) return;

    try {
      setSaving(true);
      setError(null);
      await deleteDriver(driver._id);
      navigate('/drivers'); // กลับหน้ารายการ
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'ลบไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [driver?._id, driver?.firstName, driver?.lastName, navigate]);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) {
    return (
      <div className="driver-page">
        <div className="header-row">
          <h2 className="page-title">โปรไฟล์คนขับ</h2>
        </div>
        <div className="error-container"><div className="error-message"><p>{error}</p></div></div>
      </div>
    );
  }
  if (!driver) return <div className="driver-page"><p>ไม่พบข้อมูลคนขับ</p></div>;

  return (
    <div className="driver-page">
      <div className="header-row">
        <h2 className="page-title">โปรไฟล์คนขับ</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="back-btn" onClick={() => navigate(-1)}>
    ⬅ ย้อนกลับ
  </button>
          <button className="add-driver-button" onClick={() => setShowEdit(true)}>แก้ไข</button>
          <button
            className="delete-btn"
            onClick={handleDelete}
            disabled={saving}
            style={{ backgroundColor: '#ef4444' }}
          >
            {saving ? 'กำลังลบ...' : 'ลบ'}
          </button>
        </div>
      </div>

      <div className="driver-card" style={{ cursor: 'default' }}>
        {!!driver.profile_img && (
          <img className="profile-img" src={driver.profile_img} alt={`${driver.firstName} ${driver.lastName}`} />
        )}
        <div className="driver-info">
          <h3>{driver.firstName} {driver.lastName}</h3>
          <p><strong>ตำแหน่ง :</strong> {driver.position}</p>
          <p><strong>บริษัท :</strong> {driver.company}</p>
          <p><strong>เบอร์โทรศัพท์ :</strong> {driver.phoneNumber}</p>
          {driver.detail && <p><strong>รายละเอียด :</strong> {driver.detail}</p>}
        </div>
        <div className="driver-id">ID: {driver._id}</div>
      </div>

      <DriverModal
        visible={showEdit}
        editing={driver}
        error={error}
        saving={saving}
        form={form}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onClose={() => setShowEdit(false)}
        onSave={handleSave}
      />
    </div>
  );
}
