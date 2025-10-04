import React, { useRef } from "react";
import { IWorkOrder } from "../../types/WorkOrder";
import "../../styles/pages/WorkOrderModal.css";

interface WorkOrderFormModalProps {
    show: boolean;
    editing: IWorkOrder | null;
    form: IWorkOrder;
    drivers: string[];
    truckHeadRegs: string[];
    truckTailRegs: string[];
    containerNumbers: string[];
    submitting: boolean;
    loadingDropdowns: boolean;
    onChange: (k: keyof IWorkOrder, v: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
}

export default function WorkOrderFormModal({
    show,
    editing,
    form,
    drivers,
    truckHeadRegs,
    truckTailRegs,
    containerNumbers,
    submitting,
    loadingDropdowns,
    onChange,
    onSubmit,
    onCancel,
}: WorkOrderFormModalProps) {
    const formRef = useRef<HTMLFormElement | null>(null);
    const headRef = useRef<HTMLInputElement | null>(null);
    const tailRef = useRef<HTMLInputElement | null>(null);
    const containerRef = useRef<HTMLInputElement | null>(null);

    if (!show) return null;

    // --- formatter ---
    const formatBookingId = (input?: string) => {
        if (!input) return "";
        const raw = String(input).toUpperCase().replace(/[^A-Z0-9]/g, "");
        const letters = raw.slice(0, 2).replace(/[^A-Z]/g, "");
        const digits = raw.slice(2).replace(/[^0-9]/g, "");
        return digits
            ? `${letters}${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 7)}`
            : letters;
    };

    const formatTruckReg = (input?: string) => {
        if (!input) return "";
        const raw = String(input).replace(/[^0-9]/g, "");
        return raw.length > 3 ? raw.slice(0, 3) + "-" + raw.slice(3, 7) : raw;
    };

    const formatContainer = (input?: string) => {
        if (!input) return "";
        const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const letters = raw.slice(0, 4).replace(/[^A-Z]/g, "");
        const digits = raw.replace(/[^0-9]/g, "").slice(0, 7);
        return letters + (digits ? "-" + digits : "");
    };

    // --- submit ---
    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const f = formRef.current;
        if (f && !f.checkValidity()) {
            f.reportValidity();
            return;
        }
        onSubmit(e);
    };

    return (
        <div className="workorder-modal-backdrop" onClick={onCancel}>
            <div className="workorder-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{editing ? "✏️ แก้ไขใบสั่งงาน" : "➕ สร้างใบสั่งงานใหม่"}</h3>

                <form ref={formRef} onSubmit={handleLocalSubmit} className="workorder-modal-form">
                    <div className="workorder-form-grid">
                        {/* ซ้าย */}
                        <div className="workorder-form-left">
                            <div className="workorder-form-row">
                                <label>วันที่ออก</label>
                                <input
                                    type="date"
                                    value={form.issueDate || ""}
                                    onChange={(e) => onChange("issueDate", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="workorder-form-row">
                                <label>เลขใบสั่งงาน</label>
                                <input
                                    pattern="[A-Z]{2}[0-9]{2}-[0-9]{2}-[0-9]{3}"
                                    value={form.workOrderNumber || ""}
                                    onChange={(e) =>
                                        onChange("workOrderNumber", formatBookingId(e.target.value))
                                    }
                                    placeholder="เช่น LL99-99-999"
                                    required
                                />
                            </div>

                            <div className="workorder-form-row">
                                <label>สินค้า</label>
                                <input
                                    value={form.product || ""}
                                    onChange={(e) => onChange("product", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="workorder-form-row">
                                <label>คนขับ</label>
                                <input
                                    list="driver-list"
                                    value={form.driverName || ""}
                                    onChange={(e) => onChange("driverName", e.target.value)}
                                    required
                                    disabled={loadingDropdowns}
                                    placeholder={loadingDropdowns ? "⏳ กำลังโหลด..." : "เลือกคนขับ"}
                                />
                                <datalist id="driver-list">
                                    {drivers.map((d) => (
                                        <option key={d} value={d} />
                                    ))}
                                </datalist>
                            </div>
                        </div>

                        {/* ขวา */}
                        <div className="workorder-form-right">
                            <div className="workorder-form-row">
                                <label>ทะเบียนหัว</label>
                                <input
                                    ref={headRef}
                                    pattern="^[0-9]{3}-[0-9]{4}$"
                                    list="head-list"
                                    value={form.headPlate || ""}
                                    onChange={(e) =>
                                        onChange("headPlate", formatTruckReg(e.target.value))
                                    }
                                    required
                                    disabled={loadingDropdowns}
                                    placeholder={loadingDropdowns ? "⏳ กำลังโหลด..." : "ทะเบียนหัว"}
                                />
                                <datalist id="head-list">
                                    {truckHeadRegs.map((r) => (
                                        <option key={r} value={r} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="workorder-form-row">
                                <label>ทะเบียนหาง</label>
                                <input
                                    ref={tailRef}
                                    pattern="^[0-9]{3}-[0-9]{4}$"
                                    list="tail-list"
                                    value={form.tailPlate || ""}
                                    onChange={(e) =>
                                        onChange("tailPlate", formatTruckReg(e.target.value))
                                    }
                                    required
                                    disabled={loadingDropdowns}
                                    placeholder={loadingDropdowns ? "⏳ กำลังโหลด..." : "ทะเบียนหาง"}
                                />
                                <datalist id="tail-list">
                                    {truckTailRegs.map((r) => (
                                        <option key={r} value={r} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="workorder-form-row">
                                <label>หมายเลขตู้</label>
                                <input
                                    ref={containerRef}
                                    pattern="^[A-Z]{4}-[0-9]{7}$"
                                    list="container-list"
                                    value={form.containerNumber || ""}
                                    onChange={(e) =>
                                        onChange("containerNumber", formatContainer(e.target.value))
                                    }
                                    required
                                    disabled={loadingDropdowns}
                                    placeholder={loadingDropdowns ? "⏳ กำลังโหลด..." : "หมายเลขตู้"}
                                />
                                <datalist id="container-list">
                                    {containerNumbers.map((c) => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                            </div>

                            <div className="workorder-form-row">
                                <label>บริษัท</label>
                                <select
                                    value={form.companyName || ""}
                                    onChange={(e) => onChange("companyName", e.target.value)}
                                    required
                                >
                                    <option value="">-- เลือกบริษัท --</option>
                                    <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                                    <option value="รถร่วม">รถร่วม</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="workorder-form-row workorder-form-full">
                        <label>รายละเอียด</label>
                        <textarea
                            value={form.description || ""}
                            onChange={(e) => onChange("description", e.target.value)}
                        />
                    </div>

                    <div className="workorder-modal-actions">
                        <button type="button" onClick={onCancel}>
                            ยกเลิก
                        </button>
                        <button type="submit" disabled={submitting}>
                            {submitting
                                ? "กำลังบันทึก..."
                                : editing
                                    ? "บันทึกการแก้ไข"
                                    : "เพิ่มรายการ"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
