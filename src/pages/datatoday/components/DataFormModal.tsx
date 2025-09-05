import React from "react";
import { DataToday } from "../../../types/DataToday";

interface DataFormModalProps {
    show: boolean;
    editing: Partial<DataToday> | null;
    form: Partial<DataToday>;
    drivers: string[];
    truckHeadRegs: string[];
    truckTailRegs: string[];
    containerNumbers: string[];
    submitting: boolean;
    onChange: (k: keyof DataToday, v: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export default function DataFormModal({
    show,
    editing,
    form,
    drivers,
    truckHeadRegs,
    truckTailRegs,
    containerNumbers,
    submitting,
    onChange,
    onSubmit,
    onCancel,
}: DataFormModalProps) {
    if (!show) return null;

    return (
        <div className="data-today-modal-backdrop">
            <div className="data-today-modal">
                <h3 className="data-today-modal-title">{editing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}</h3>
                <form onSubmit={onSubmit} className="data-today-modal-form">
                    <div className="data-today-modal-row">
                        <label>วันที่เข้า</label>
                        <input
                            type="date"
                            value={form.datetime_in || ""}
                            onChange={(e) => onChange("datetime_in", e.target.value)}
                            required
                        />
                    </div>

                    <div className="data-today-modal-row">
                        <label>คนขับ</label>
                        <input
                            list="driver-list"
                            value={form.driver_name || ""}
                            onChange={(e) => onChange("driver_name", e.target.value)}
                            required
                        />
                        <datalist id="driver-list">
                            {drivers.map((d) => (
                                <option key={d} value={d} />
                            ))}
                        </datalist>
                    </div>

                    <div className="data-today-modal-row">
                        <label>ทะเบียนหัว</label>
                        <input
                            list="truck-head-list"
                            value={form.head_registration || ""}
                            onChange={(e) => onChange("head_registration", e.target.value)}
                            required
                        />
                        <datalist id="truck-head-list">
                            {truckHeadRegs.map((r) => (
                                <option key={r} value={r} />
                            ))}
                        </datalist>
                    </div>

                    <div className="data-today-modal-row">
                        <label>ทะเบียนหาง</label>
                        <input
                            list="truck-tail-list"
                            value={form.tail_registration || ""}
                            onChange={(e) => onChange("tail_registration", e.target.value)}
                            required
                        />
                        <datalist id="truck-tail-list">
                            {truckTailRegs.map((r) => (
                                <option key={r} value={r} />
                            ))}
                        </datalist>
                    </div>

                    <div className="data-today-modal-row">
                        <label>หมายเลขตู้</label>
                        <input
                            list="container-list"
                            value={form.container_no || ""}
                            onChange={(e) => onChange("container_no", e.target.value)}
                            required
                        />
                        <datalist id="container-list">
                            {containerNumbers.map((cn) => (
                                <option key={cn} value={cn} />
                            ))}
                        </datalist>
                    </div>

                    <div className="data-today-modal-row">
                        <label>ตำแหน่ง</label>
                        <input
                            value={form.station_in || ""}
                            onChange={(e) => onChange("station_in", e.target.value)}
                            required
                        />
                    </div>

                    <div className="data-today-modal-row">
                        <label>บริษัท</label>
                        <select
                            value={form.companyname || ""}
                            onChange={(e) => onChange("companyname", e.target.value)}
                            required
                        >
                            <option value="">-- เลือกบริษัท --</option>
                            <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                            <option value="รถร่วม">รถร่วม</option>
                        </select>
                    </div>

                    <div className="data-today-modal-actions">
                        <button
                            className="data-today-btn data-today-btn-primary"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
                        </button>
                        <button
                            type="button"
                            className="data-today-btn data-today-btn-ghost"
                            onClick={onCancel}
                        >
                            ยกเลิก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
