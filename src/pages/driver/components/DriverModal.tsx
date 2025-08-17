import React from 'react';
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
}

export default function DriverModal({ visible, editing, error, saving, form, onChange, onClose, onSave }: Props) {
  if (!visible) return null;
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
              <input type="tel" value={form.phoneNumber} onChange={(e) => onChange({ phoneNumber: e.target.value })} required />
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
            <label>รูปโปรไฟล์ (URL):</label>
            <input type="url" value={form.profile_img} onChange={(e) => onChange({ profile_img: e.target.value })} placeholder="https://example.com/profile.jpg" />
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