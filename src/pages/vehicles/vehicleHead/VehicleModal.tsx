import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTruck } from "@fortawesome/free-solid-svg-icons";
import { ITruckHead } from "../../../api/components/truckApi";
import { useI18n } from "../../../i18n";

type VehicleForm = { licensePlate: string; companyName: string };

interface VehicleModalProps {
    visible: boolean;
    editing: ITruckHead | null;
    form: VehicleForm;
    submitting: boolean;
    onChange: (field: keyof VehicleForm, value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}

export default function VehicleModal({
    visible,
    editing,
    form,
    submitting,
    onChange,
    onSubmit,
    onClose,
}: VehicleModalProps) {
    const { t } = useI18n();
    if (!visible) return null;

    const formatLicensePlate = (value: string) => {
        const cleaned = value.replace(/[^0-9]/g, '').toUpperCase();
        
        if (cleaned.length <= 3) {
            return cleaned;
        } else {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}`;
        }
    };

    const handleLicensePlateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatLicensePlate(e.target.value);
        onChange("licensePlate", formatted);
    };

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="popup-header">
                    <div className="popup-title">
                        <FontAwesomeIcon icon={faTruck} className="popup-icon" />
                        <h2>{editing ? t('vehicles.modal.edit.head') : t('vehicles.modal.create.head')}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="popup-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label htmlFor="licensePlate">{t('vehicles.form.licensePlate')} *</label>
                            <input
                                type="text"
                                id="licensePlate"
                                value={form.licensePlate}
                                onChange={handleLicensePlateChange}
                                placeholder={t('workorder.form.headPlate.placeholder')}
                                maxLength={8}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="companyName">{t('vehicles.form.companyName')} *</label>
                            <select
                                id="companyName"
                                value={form.companyName}
                                onChange={(e) => onChange("companyName", e.target.value)}
                                required
                            >
                                <option value="">{t('workorder.form.companyName.placeholder')}</option>
                                <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                                <option value="รถร่วม">รถร่วม</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={onClose} className="cancel-btn">
                                {t('common.cancel')}
                            </button>
                            <button type="submit" className="save-btn" disabled={submitting}>
                                {submitting
                                    ? t('common.loading')
                                    : editing
                                        ? t('common.save')
                                        : t('vehicles.add.head')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
