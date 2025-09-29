import React from "react";
import { useI18n } from "../../../i18n";
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
  const { t } = useI18n();
  if (!visible) return null;

  const formatContainerNumber = (input?: string) => {
    if (!input) return "";
    const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const letters = raw.slice(0, 4).replace(/[^A-Z]/g, "");
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 7);
    return letters + (digits ? "-" + digits : "");
  };

  const handleContainerNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatContainerNumber(e.target.value);
    onChange({ containerNumber: formatted });
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="popup-content"
        onClick={(e) => e.stopPropagation()}
      ><div className="popup-header">
          <h2 className="popup-title">
            {editing ? t('containers.modal.edit') : t('containers.modal.create')}
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
              <label>{t('containers.form.containerNumber')} *</label>
              <input
                type="text"
                value={form.containerNumber}
                onChange={handleContainerNumberChange}
                placeholder={t('containers.form.placeholderContainer')}
                maxLength={12}
                required
              />
            </div>

            <div className="container-modal-page-form-group">
              <label>{t('containers.form.companyName')} *</label>
              <select
                value={form.companyName}
                onChange={(e) => onChange({ companyName: e.target.value })}
                required
              >
                <option value="">{t('containers.form.selectCompany')}</option>
                <option value="ป๋อเฉิน">{t('containers.company.porchoen')}</option>
                <option value="บริษัทร่วม">{t('containers.company.partner')}</option>
              </select>
            </div>

            <div className="container-modal-page-form-group">
              <label>{t('containers.form.size')} *</label>
              <select
                value={form.containerSize}
                onChange={(e) => onChange({ containerSize: e.target.value })}
                required
              >
                <option value="">{t('containers.form.selectSize')}</option>
                {sizes.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="button" onClick={onClose} className="cancel-btn">
                {t('containers.buttons.cancel')}
              </button>
              <button type="submit" className="save-btn" disabled={saving}>
                {saving
                  ? t('containers.buttons.saving')
                  : editing
                    ? t('containers.buttons.saveEdit')
                    : t('containers.buttons.create')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
