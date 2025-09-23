import React from "react";
import { DataToday } from "../../../../types/DataToday";

interface DataTodayFormProps {
    editing: Partial<DataToday> | null;
    form: Partial<DataToday>;
    drivers: string[];
    truckHeadRegs: string[];
    truckTailRegs: string[];
    containerNumbers: string[];
    workOrderNumbers: string[];
    submitting: boolean;
    openPreviewFromUrl: (url: string) => void;
    openPreviewFromFile: (file: File) => void;
    onChange: (k: keyof DataToday, v: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export default function DataTodayForm({
    editing,
    form,
    drivers,
    truckHeadRegs,
    truckTailRegs,
    containerNumbers,
    workOrderNumbers,
    submitting,
    openPreviewFromUrl,
    openPreviewFromFile,
    onChange,
    onSubmit,
    onCancel,
}: DataTodayFormProps) {
    return (
        <form className="data-today-modal-form" onSubmit={onSubmit}>
            <div className="data-today-modal-row">
                <label>วันที่</label>
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
                    {containerNumbers.map((c) => (
                        <option key={c} value={c} />
                    ))}
                </datalist>
            </div>

            <div className="data-today-modal-row">
                <label>ตำแหน่ง</label>
                <input
                    type="text"
                    value={form.station_in}
                    onChange={(e) => onChange("station_in", e.target.value)}
                    placeholder="ตำแหน่งคนขับรถ"
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
                    <option value="">เลือกบริษัท</option>
                    <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                    <option value="รถร่วม">รถร่วม</option>
                </select>
            </div>

            <div className="data-today-modal-row">
                <label>เลขใบสั่งงาน</label>
                <input
                    list="workorder-list"
                    value={(form as any).booking_id || ""}
                    onChange={(e) => onChange("booking_id" as any, e.target.value)}
                    placeholder="LL99-99-999"
                />
                <datalist id="workorder-list">
                    {workOrderNumbers.map((wo) => (
                        <option key={wo} value={wo} />
                    ))}
                </datalist>
            </div>

            <div className="data-today-modal-row">
                <label>รูปใบสั่งงาน</label>
                <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => {
                        const f = e.target.files?.[0] || null;
                        onChange("booking_image" as any, f);
                    }}
                />
                {(form as any).booking_image && typeof (form as any).booking_image === "string" && (
                    <button type="button" className="data-today-modal-link" onClick={() => openPreviewFromUrl((form as any).booking_image)}>
                        ดูภาพที่แนบ
                    </button>
                )}
                {(form as any).booking_image && (form as any).booking_image instanceof File && (
                    <span
                        className="data-today-modal-file"
                        onClick={() => openPreviewFromFile((form as any).booking_image)}
                    >
                        {(form as any).booking_image.name}
                    </span>
                )}
            </div>

            <div className="data-today-modal-actions">
                <button type="button" className="data-today-modal-btn-cancel" onClick={onCancel}>
                    ยกเลิก
                </button>
                <button className="data-today-modal-btn-submit" type="submit" disabled={submitting}>
                    {submitting ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
                </button>
            </div>
        </form>
    );
}
