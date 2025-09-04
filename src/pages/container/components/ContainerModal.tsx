// src/pages/container/components/ContainerModal.tsx
import React from 'react';
import { Containers, SizeOption } from './types';

interface Props {
  visible: boolean;
  editing: Containers | null;
  error: string | null;
  saving: boolean;
  form: Omit<Containers, '_id'>;

  // ✅ รับเป็น readonly array ของ readonly item
  sizes: readonly SizeOption[];

  onChange: (patch: Partial<Omit<Containers, '_id'>>) => void;
  onClose: () => void;
  onSave: () => void;
}

// Function สำหรับ format container number xxxx-xxxxxxx
const formatContainerNumber = (value: string): string => {
  // ลบตัวอักษรที่ไม่ใช่ตัวอักษรและตัวเลข
  const cleaned = value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  // จำกัดความยาวไม่เกิน 11 ตัวอักษร
  const limited = cleaned.slice(0, 11);
  
  // เพิ่ม dash หลังตัวอักษรที่ 4
  if (limited.length > 4) {
    return limited.slice(0, 4) + '-' + limited.slice(4);
  }
  return limited;
};

export default function ContainerModal({
  visible, editing, error, saving, form, sizes, onChange, onClose, onSave,
}: Props) {
  if (!visible) return null;

  const handleContainerNumberChange = (value: string) => {
    const formatted = formatContainerNumber(value);
    onChange({ containerNumber: formatted });
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{editing ? 'แก้ไขตู้คอนเทนเนอร์' : 'เพิ่มตู้คอนเทนเนอร์'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error"><p>{error}</p></div>}

          <div className="form-group">
            <label>หมายเลขตู้คอนเทนเนอร์:</label>
            <input
              type="text"
              value={form.containerNumber || ''}
              onChange={(e) => handleContainerNumberChange(e.target.value)}
              placeholder="xxxx-xxxxxxx"
              maxLength={12}
              required
            />
          </div>

          <div className="form-group">
            <label>ชื่อบริษัท:</label>
            <select
              value={form.companyName || ''}
              onChange={(e) => onChange({ companyName: e.target.value })}
              required
            >
              <option value="">-- เลือกบริษัท --</option>
              <option value="ป๋อเฉิน">ป๋อเฉิน</option>
              <option value="รถร่วม">รถร่วม</option>
            </select>
          </div>

          <div className="form-group">
            <label>ขนาดตู้คอนเทนเนอร์:</label>
            <select
              value={form.containerSize || ''}
              onChange={(e) => onChange({ containerSize: e.target.value })}
            >
              <option value="">เลือกขนาดตู้คอนเทนเนอร์</option>
              {sizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>ยกเลิก</button>
          <button className="btn-save" onClick={onSave} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : editing ? 'อัปเดต' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  );
}
