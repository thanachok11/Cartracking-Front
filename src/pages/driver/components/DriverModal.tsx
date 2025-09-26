import React, { useEffect } from 'react';
import type { Driver } from '../../../api/components/driversApi';
interface Props {
  visible: boolean;
  editing: Driver | null;
  error: string | null;
  saving: boolean;
  form: Omit<Driver, '_id'>;
  onChange: (patch: Partial<Omit<Driver, '_id'>>) => void;
  onClose: () => void;
  onSave: () => void;

  imageFile: File | null;
  onImageFileChange: (file: File | null) => void;
}

export default function DriverModal({ visible, editing, error, saving, form, onChange, onClose, onSave, imageFile, onImageFileChange }: Props) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url); // Clean up the URL object
    }
    if (!imageFile && form.profile_img) {
      setPreviewUrl(form.profile_img);
    } else {
      setPreviewUrl(null);
    }
  }, [imageFile, form.profile_img]);

  if (!visible) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      onImageFileChange(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert("กรุณาเลือกรูปภาพเท่านั้น")
      return;
    }
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      alert("ขนาดไฟล์ต้องไม่เกิน 5MB");
      return;
    }
    onImageFileChange(file);
  };

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    } else {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    onChange({ phoneNumber: formatted });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>{editing ? 'แก้ไขข้อมูลคนขับ' : 'เพิ่มคนขับใหม่'}</h3>
        {error && <div className="error-alert">{error}</div>}
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
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
              <input 
                type="tel" 
                value={form.phoneNumber} 
                onChange={handlePhoneChange}
                maxLength={12}
                required 
              />
            </div>
            <div className="form-group">
              <label>ตำแหน่ง:</label>
              <input type="text" value={form.position} onChange={(e) => onChange({ position: e.target.value })} required />
            </div>
          </div>       
          <div className="form-group">
            <label htmlFor="companyName">ชื่อบริษัท *</label>
            <select
              id="companyName"
              value={form.company}
              onChange={(e) => onChange({ company: e.target.value })} required 
              >
            
              <option value="">เลือกบริษัท</option>
              <option value="ป๋อเฉิน2014">ป๋อเฉิน2014</option>
              <option value="รถร่วม">รถร่วม</option>
            </select>
          </div>
          <div className="form-group">
            <label>รายละเอียด:</label>
            <textarea value={form.detail} onChange={(e) => onChange({ detail: e.target.value })} rows={3} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />
          </div>
          <div className="form-group">
            <label>รูปโปรไฟล์:</label>
            <div className="image-upload-container">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="file-input"
              />
              {previewUrl && (
                <div className="image-preview">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="img-preview" 
                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 8, border: '2px solid #ddd' }}
                  />
                  {imageFile && (
                    <button 
                      type="button" 
                      className="remove-image-btn"
                      onClick={() => onImageFileChange(null)}
                    >
                      ลบรูป
                    </button>
                  )}
                </div>
              )}
              <small className="hint">รองรับไฟล์ภาพ JPG, PNG, GIF ขนาดไม่เกิน 5MB</small>
            </div>
          </div>
          <div className="modal-actions">
          
            <button type="button" className="cancel-btn" onClick={onClose} disabled={saving}>ยกเลิก</button>
            <button type="submit" className="save-btn" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : editing ? 'บันทึกการแก้ไข' : 'เพิ่มคนขับ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}