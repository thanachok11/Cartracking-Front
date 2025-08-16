import React, { useState, useEffect } from 'react';
import type { Driver } from '../../../api/components/driversApi';

interface Props {
  visible: boolean;
  editing: Driver | null;
  error: string | null;
  saving: boolean;
  form: Omit<Driver, "_id">;
  onChange: (patch: Partial<Omit<Driver, "_id">>) => void;
  onClose: () => void;
  onSave: (formData: FormData) => void; // ส่ง FormData
  onFileChange?: (file: File | null) => void; // ✅ เพิ่มตรงนี้
}


export default function DriverModal({ visible, editing, error, saving, form, onChange, onClose, onSave }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(form.profile_img || null);

  useEffect(() => {
    // ถ้าเปิด modal ใหม่ หรือแก้ไขคนขับเก่า ให้รีเซ็ตไฟล์และ preview
    setFile(null);
    setPreview(form.profile_img || null);
  }, [visible, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(form.profile_img || null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('firstName', form.firstName);
    formData.append('lastName', form.lastName);
    formData.append('phoneNumber', form.phoneNumber);
    formData.append('position', form.position);
    formData.append('company', form.company);
    if (form.detail) formData.append('detail', form.detail);
    if (file) formData.append('image', file); // ชื่อ field ต้องตรงกับ backend

    onSave(formData); // ส่งไป parent
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{editing ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มคนขับใหม่'}</h3>
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>ชื่อ:</label>
              <input type="text" value={form.firstName} onChange={(e) => onChange({ firstName: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>นามสกุล:</label>
              <input type="text" value={form.lastName} onChange={(e) => onChange({ lastName: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>เบอร์โทรศัพท์:</label>
              <input type="tel" value={form.phoneNumber} onChange={(e) => onChange({ phoneNumber: e.target.value.replace(/\D/g, '') })} required maxLength={10} pattern="[0-9]*" />
            </div>
            <div className="form-group">
              <label>ตำแหน่ง:</label>
              <input type="text" value={form.position} onChange={(e) => onChange({ position: e.target.value })} required />
            </div>
          </div>
          <div className="form-group">
            <label>บริษัท:</label>
            <input type="text" value={form.company} onChange={(e) => onChange({ company: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>รายละเอียด:</label>
            <textarea value={form.detail} onChange={(e) => onChange({ detail: e.target.value })} rows={3} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />
          </div>
          <div className="form-group">
            <label>รูปโปรไฟล์:</label>
            <input type="file" accept="image/*" onChange={handleFileChange} />
            {preview && (
              <div style={{ marginTop: 8 }}>
                <img
                  src={preview}
                  alt="preview"
                  style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : editing ? 'บันทึกการแก้ไข' : 'เพิ่มคนขับ'}
            </button>
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>ยกเลิก</button>
          </div>
        </form>
      </div>
    </div>
  );
}
