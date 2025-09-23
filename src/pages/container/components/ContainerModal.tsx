import React from "react";
import { Containers } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";

interface ContainerModalProps {
  visible: boolean;
  editing: Containers | null;
  error: string | null;
  saving: boolean;
  form: Omit<Containers, "_id">;
  sizes: readonly { value: string; label: string }[];
  onChange: (patch: Partial<Omit<Containers, "_id">>) => void;
  onClose: () => void;
  onSave: () => void;
}

export default function ContainerModal({
  visible,
  editing,
  error,
  saving,
  form,
  sizes,
  onChange,
  onClose,
  onSave,
}: ContainerModalProps) {
  if (!visible) return null;

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
      ><div className="popup-header">
          <h2 className="popup-title">
            {editing ? "แก้ไขตู้คอนเทนเนอร์" : "เพิ่มตู้คอนเทนเนอร์ใหม่"}
          </h2>
          <button className="container-modal-page-close-btn" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
          {error && <div className="container-modal-page-error">{error}</div>}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSave();
          }}
        >
          <div className="popup-body">
            <div className="container-modal-page-form-group">
              <label>หมายเลขตู้ *</label>
              <input
                type="text"
                value={form.containerNumber}
                onChange={(e) => onChange({ containerNumber: e.target.value })}
                required
              />
            </div>

            <div className="container-modal-page-form-group">
              <label>บริษัท *</label>
              <select
                value={form.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                required
              >
                <option value="">เลือกบริษัท</option>
                <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                <option value="รถร่วม">รถร่วม</option>
              </select>
            </div>

            <div className="container-modal-page-form-group">
              <label>ขนาด *</label>
              <select
                value={form.containerSize}
                onChange={(e) => onChange({ containerSize: e.target.value })}
                required
              >
                <option value="">เลือกขนาด</option>
                {sizes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                ยกเลิก
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving
                  ? "กำลังบันทึก..."
                  : editing
                    ? "บันทึกการแก้ไข"
                    : "เพิ่มข้อมูล"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
