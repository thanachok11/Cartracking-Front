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

export default function ContainerModal({
  visible, editing, error, saving, form, sizes, onChange, onClose, onSave,
}: Props) {
  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>{editing ? 'Edit Container' : 'Add Container'}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {error && <div className="modal-error"><p>{error}</p></div>}

          <div className="form-group">
            <label>Container Number:</label>
            <input
              type="text"
              value={form.containerNumber || ''}
              onChange={(e) => onChange({ containerNumber: e.target.value })}
              placeholder="Enter container number"
              required
            />
          </div>

          <div className="form-group">
            <label>Company Name:</label>
            <input
              type="text"
              value={form.companyName || ''}
              onChange={(e) => onChange({ companyName: e.target.value })}
              placeholder="Enter company name"
            />
          </div>

          <div className="form-group">
            <label>Container Size:</label>
            <select
              value={form.containerSize || ''}
              onChange={(e) => onChange({ containerSize: e.target.value })}
            >
              <option value="">Select container size</option>
              {sizes.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={onSave} disabled={saving}>
            {saving ? 'Saving...' : editing ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
