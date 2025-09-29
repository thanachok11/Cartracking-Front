import React, { useRef } from "react";
import { IWorkOrder } from "../../types/WorkOrder";
import "../../styles/pages/WorkOrderModal.css";
import { useI18n } from "../../i18n";

interface WorkOrderFormModalProps {
    show: boolean;
    editing: IWorkOrder | null;
    form: IWorkOrder;
    drivers: string[];
    driversPhone: string[];
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
    driversPhone,
    truckHeadRegs,
    truckTailRegs,
    containerNumbers,
    submitting,
    loadingDropdowns,
    onChange,
    onSubmit,
    onCancel,
}: WorkOrderFormModalProps) {
    const { t } = useI18n();
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

    const formatPhoneNumber = (input?: string) => {
        if (!input) return "";
        const raw = input.replace(/[^0-9]/g, "");
        if (raw.length <= 3) return raw;
        if (raw.length <= 6) return raw.slice(0, 3) + "-" + raw.slice(3);
        return raw.slice(0, 3) + "-" + raw.slice(3, 6) + "-" + raw.slice(6, 10);
    };

    // --- submit ---
    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const f = formRef.current;
        if (f && !f.checkValidity()) {
            f.reportValidity();
            return;
        }

        // ตรวจสอบเพิ่มเติมสำหรับการสร้างใหม่
        if (!editing) {
            // ตรวจสอบว่าข้อมูลที่กรอกตรงกับ dropdown หรือไม่
            if (form.driverName && !drivers.includes(form.driverName)) {
                alert("⚠️ " + t('drivers.noData.subtitle'));
                return;
            }

            if (form.headPlate && !truckHeadRegs.includes(form.headPlate)) {
                alert("⚠️ " + t('vehicles.noData.head'));
                return;
            }

            if (form.tailPlate && !truckTailRegs.includes(form.tailPlate)) {
                alert("⚠️ " + t('vehicles.noData.tail'));
                return;
            }

            if (form.containerNumber && !containerNumbers.includes(form.containerNumber)) {
                alert("⚠️ " + t('containers.noData.title'));
                return;
            }
        }

        onSubmit(e);
    };

    return (
        <div className="workorder-modal-backdrop" onClick={onCancel}>
            <div className="workorder-modal" onClick={(e) => e.stopPropagation()}>
                <h3>{editing ? t('workorder.form.title.edit') : t('workorder.form.title.create')}</h3>

                <form ref={formRef} onSubmit={handleLocalSubmit} className="workorder-modal-form">
                    <div className="workorder-form-grid">
                        {/* ซ้าย */}
                        <div className="workorder-form-left">
                            <div className="workorder-form-row">
                                <label>{t('workorder.form.issueDate')}</label>
                                <input
                                    type="date"
                                    value={form.issueDate || ""}
                                    onChange={(e) => onChange("issueDate", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="workorder-form-row">
                                <label>{t('workorder.form.number')}</label>
                                <input
                                    pattern="[A-Z]{2}[0-9]{2}-[0-9]{2}-[0-9]{3}"
                                    value={form.workOrderNumber || ""}
                                    onChange={(e) =>
                                        onChange("workOrderNumber", formatBookingId(e.target.value))
                                    }
                                    placeholder={t('workorder.form.number.placeholder')}
                                    required
                                />
                            </div>

                            <div className="workorder-form-row">
                                <label>{t('workorder.form.product')}</label>
                                <input
                                    value={form.product || ""}
                                    onChange={(e) => onChange("product", e.target.value)}
                                    required
                                />
                            </div>

                            <div className="workorder-form-row">
                                <label>{t('workorder.form.driverName')}</label>
                                <input
                                    list="driver-list"
                                    value={form.driverName || ""}
                                    onChange={(e) => onChange("driverName", e.target.value)}
                                    required
                                    disabled={loadingDropdowns}
                                    placeholder={loadingDropdowns ? `⏳ ${t('common.loading')}` : t('drivers.title')}
                                    style={{
                                        borderColor: form.driverName && !drivers.includes(form.driverName) ? "#dc2626" : ""
                                    }}
                                />
                                <datalist id="driver-list">
                                    {drivers.map((d) => (
                                        <option key={d} value={d} />
                                    ))}
                                </datalist>
                                {form.driverName && !drivers.includes(form.driverName) && (
                                    <small style={{color: "#dc2626"}}>⚠️ {t('drivers.noData.subtitle')}</small>
                                )}
                            </div>

                            <div className="workorder-form-row">
                                <label>{t('workorder.table.driverPhone')}</label>
                                <input
                                    type="tel"
                                    value={form.driverPhone || ""}
                                    onChange={(e) => onChange("driverPhone", formatPhoneNumber(e.target.value))}
                                    required
                                    placeholder={t('workorder.form.driverPhone.placeholder')}
                                    pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                                />
                            </div>
                        </div>

                        {/* ขวา */}
                        <div className="workorder-form-right">
                            <div className="workorder-form-row">
                                <label>{t('workorder.table.headPlate')}</label>
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
                                    placeholder={loadingDropdowns ? `⏳ ${t('common.loading')}` : t('vehicles.add.head')}
                                    style={{
                                        borderColor: form.headPlate && !truckHeadRegs.includes(form.headPlate) ? "#dc2626" : ""
                                    }}
                                />
                                <datalist id="head-list">
                                    {truckHeadRegs.map((r) => (
                                        <option key={r} value={r} />
                                    ))}
                                </datalist>
                                {form.headPlate && !truckHeadRegs.includes(form.headPlate) && (
                                    <small style={{color: "#dc2626"}}>⚠️ {t('vehicles.noData.head')}</small>
                                )}
                            </div>

                            <div className="workorder-form-row">
                                <label>{t('workorder.table.tailPlate')}</label>
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
                                    placeholder={loadingDropdowns ? `⏳ ${t('common.loading')}` : t('vehicles.add.tail')}
                                    style={{
                                        borderColor: form.tailPlate && !truckTailRegs.includes(form.tailPlate) ? "#dc2626" : ""
                                    }}
                                />
                                <datalist id="tail-list">
                                    {truckTailRegs.map((r) => (
                                        <option key={r} value={r} />
                                    ))}
                                </datalist>
                                {form.tailPlate && !truckTailRegs.includes(form.tailPlate) && (
                                    <small style={{color: "#dc2626"}}>⚠️ {t('vehicles.noData.tail')}</small>
                                )}
                            </div>

                            <div className="workorder-form-row">
                                <label>{t('workorder.table.containerNumber')}</label>
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
                                    placeholder={loadingDropdowns ? `⏳ ${t('common.loading')}` : t('containers.form.containerNumber')}
                                    style={{
                                        borderColor: form.containerNumber && !containerNumbers.includes(form.containerNumber) ? "#dc2626" : ""
                                    }}
                                />
                                <datalist id="container-list">
                                    {containerNumbers.map((c) => (
                                        <option key={c} value={c} />
                                    ))}
                                </datalist>
                                {form.containerNumber && !containerNumbers.includes(form.containerNumber) && (
                                    <small style={{color: "#dc2626"}}>⚠️ {t('containers.noData.title')}</small>
                                )}
                            </div>

                            <div className="workorder-form-row">
                                <label>{t('workorder.table.companyName')}</label>
                                <select
                                    value={form.companyName || ""}
                                    onChange={(e) => onChange("companyName", e.target.value)}
                                    required
                                >
                                    <option value="">{t('workorder.form.companyName.placeholder')}</option>
                                    <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                                    <option value="รถร่วม">รถร่วม</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="workorder-form-row workorder-form-full">
                        <label>{t('workorder.form.description')}</label>
                        <textarea
                            value={form.description || ""}
                            onChange={(e) => onChange("description", e.target.value)}
                        />
                    </div>

                    <div className="workorder-modal-actions">
                        <button type="button" onClick={onCancel}>{t('common.cancel')}</button>
                        <button type="submit" disabled={submitting}>
                            {submitting ? t('common.loading') : editing ? t('common.save') : t('common.add')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
