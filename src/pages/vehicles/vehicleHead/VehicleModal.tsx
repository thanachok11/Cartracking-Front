import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTruck } from "@fortawesome/free-solid-svg-icons";
import { ITruckHead } from "../../../api/components/truckApi";

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
    if (!visible) return null;

    return (
        <div className="popup-overlay" onClick={onClose}>
            <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                <div className="popup-header">
                    <div className="popup-title">
                        <FontAwesomeIcon icon={faTruck} className="popup-icon" />
                        <h2>{editing ? "แก้ไขทะเบียนหัว" : "เพิ่มทะเบียนหัวใหม่"}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="popup-body">
                    <form onSubmit={onSubmit}>
                        <div className="form-group">
                            <label htmlFor="licensePlate">ทะเบียนรถ *</label>
                            <input
                                type="text"
                                id="licensePlate"
                                value={form.licensePlate}
                                onChange={(e) => onChange("licensePlate", e.target.value)}
                                placeholder="xxx-xxxx"
                                maxLength={8}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="companyName">ชื่อบริษัท *</label>
                            <select
                                id="companyName"
                                value={form.companyName}
                                onChange={(e) => onChange("companyName", e.target.value)}
                                required
                            >
                                <option value="">-- เลือกบริษัท --</option>
                                <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                                <option value="รถร่วม">รถร่วม</option>
                            </select>
                        </div>

                        <div className="form-actions">
                            <button type="button" onClick={onClose} className="cancel-btn">
                                ยกเลิก
                            </button>
                            <button type="submit" className="save-btn" disabled={submitting}>
                                {submitting
                                    ? "กำลังบันทึก..."
                                    : editing
                                        ? "บันทึกการแก้ไข"
                                        : "เพิ่มข้อมูล"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
