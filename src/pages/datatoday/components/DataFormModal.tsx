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
    const formRef = React.useRef<HTMLFormElement | null>(null);
    // refs for inputs so we can set custom validity messages
    const driverRef = React.useRef<HTMLInputElement | null>(null);
    const headRef = React.useRef<HTMLInputElement | null>(null);
    const tailRef = React.useRef<HTMLInputElement | null>(null);
    const containerRef = React.useRef<HTMLInputElement | null>(null);

    // image preview state (declare hooks before any early return)
    const [previewSrc, setPreviewSrc] = React.useState<string | null>(null);
    const [previewVisible, setPreviewVisible] = React.useState(false);

    const openPreviewFromUrl = (url: string) => {
        setPreviewSrc(url);
        setPreviewVisible(true);
    };

    const openPreviewFromFile = (file: File) => {
        const url = URL.createObjectURL(file);
        setPreviewSrc(url);
        setPreviewVisible(true);
    };

    // normalized sets for realtime validation (memoized)
    const normDrivers = React.useMemo(() => new Set(drivers.map(d => String(d||'').trim().toLowerCase())), [drivers]);
    const normHeadRegs = React.useMemo(() => new Set(truckHeadRegs.map(h => String(h||'').replace(/\D/g, ''))), [truckHeadRegs]);
    const normTailRegs = React.useMemo(() => new Set(truckTailRegs.map(t => String(t||'').replace(/\D/g, ''))), [truckTailRegs]);
    const normContainers = React.useMemo(() => new Set(containerNumbers.map(c => String(c||'').toUpperCase().replace(/[^A-Z0-9]/g, ''))), [containerNumbers]);

    // realtime validation helpers
    const validateDriverValue = (val?: string) => {
        if (!driverRef.current) return;
        const s = String(val || '').trim();
        const bad = drivers && drivers.length && s && !normDrivers.has(s.toLowerCase());
        driverRef.current.setCustomValidity(bad ? 'คนขับไม่ตรงกับข้อมูลที่มี' : '');
    };

    const validateHeadValue = (val?: string) => {
        if (!headRef.current) return;
        const s = String(val || '').trim();
        const norm = s ? s.replace(/\D/g, '') : '';
        const bad = truckHeadRegs && truckHeadRegs.length && s && !normHeadRegs.has(norm);
        headRef.current.setCustomValidity(bad ? 'ทะเบียนหัวไม่ตรงกับข้อมูลที่มี' : '');
    };

    const validateTailValue = (val?: string) => {
        if (!tailRef.current) return;
        const s = String(val || '').trim();
        const norm = s ? s.replace(/\D/g, '') : '';
        const bad = truckTailRegs && truckTailRegs.length && s && !normTailRegs.has(norm);
        tailRef.current.setCustomValidity(bad ? 'ทะเบียนหางไม่ตรงกับข้อมูลที่มี' : '');
    };

    const validateContainerValue = (val?: string) => {
        if (!containerRef.current) return;
        const s = String(val || '').trim();
        const norm = s ? s.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
        const bad = containerNumbers && containerNumbers.length && s && !normContainers.has(norm);
        containerRef.current.setCustomValidity(bad ? 'หมายเลขตู้ไม่ตรงกับข้อมูลที่มี' : '');
    };

    const closePreview = () => {
        if (previewSrc && previewSrc.startsWith('blob:')) {
            try { URL.revokeObjectURL(previewSrc); } catch {}
        }
        setPreviewVisible(false);
        setPreviewSrc(null);
    };

    // validate initial values when modal opens
    React.useEffect(() => {
        if (!show) return;
        validateDriverValue(form.driver_name as string | undefined);
        validateHeadValue(form.head_registration as string | undefined);
        validateTailValue(form.tail_registration as string | undefined);
        validateContainerValue(form.container_no as string | undefined);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [show]);

    // hide modal UI when not shown (hooks run unconditionally above)
    if (!show) return null;

    const handleLocalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const f = formRef.current;
        if (f) {
            // custom validations against provided lists
            try {
                // prepare normalized sets for comparison
                const normDrivers = new Set(drivers.map(d => String(d||'').trim().toLowerCase()));
                const normHeadRegs = new Set(truckHeadRegs.map(h => String(h||'').replace(/\D/g, '')));
                const normTailRegs = new Set(truckTailRegs.map(t => String(t||'').replace(/\D/g, '')));
                const normContainers = new Set(containerNumbers.map(c => String(c||'').toUpperCase().replace(/[^A-Z0-9]/g, '')));
                if (driverRef.current) {
                    const val = String(form.driver_name || '').trim();
                    const bad = drivers && drivers.length && val && !normDrivers.has(val.toLowerCase());
                    driverRef.current.setCustomValidity(bad ? 'คนขับไม่ตรงกับข้อมูลที่มี' : '');
                }
                if (headRef.current) {
                    const val = String(form.head_registration || '').trim();
                    const norm = val ? val.replace(/\D/g, '') : '';
                    const bad = truckHeadRegs && truckHeadRegs.length && val && !normHeadRegs.has(norm);
                    headRef.current.setCustomValidity(bad ? 'ทะเบียนหัวไม่ตรงกับข้อมูลที่มี' : '');
                }
                if (tailRef.current) {
                    const val = String(form.tail_registration || '').trim();
                    const norm = val ? val.replace(/\D/g, '') : '';
                    const bad = truckTailRegs && truckTailRegs.length && val && !normTailRegs.has(norm);
                    tailRef.current.setCustomValidity(bad ? 'ทะเบียนหางไม่ตรงกับข้อมูลที่มี' : '');
                }
                if (containerRef.current) {
                    const val = String(form.container_no || '').trim();
                    const norm = val ? val.toUpperCase().replace(/[^A-Z0-9]/g, '') : '';
                    const bad = containerNumbers && containerNumbers.length && val && !normContainers.has(norm);
                    containerRef.current.setCustomValidity(bad ? 'หมายเลขตู้ไม่ตรงกับข้อมูลที่มี' : '');
                }
            } catch (err) {
                // ignore
            }
            // run native validation; if invalid, show messages and stop
            if (!f.checkValidity()) {
                // reportValidity shows native UI in browsers
                // and will focus the first invalid control
                f.reportValidity();
                return;
            }
        }
        // all good, call parent handler
        onSubmit(e);
    };

    // format booking id to pattern LL99-99-999 (2 letters then 7 digits grouped)
    const formatBookingId = (input?: string) => {
        if (!input) return '';
        const raw = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const patternTypes = ['L','L','9','9','9','9','9','9','9']; // 2 letters then 7 digits
        let filled = '';
        let idx = 0;
        for (let i = 0; i < patternTypes.length; i++) {
            const expect = patternTypes[i];
            while (idx < raw.length) {
                const ch = raw[idx++];
                if (expect === 'L' && /[A-Z]/.test(ch)) { filled += ch; break; }
                if (expect === '9' && /[0-9]/.test(ch)) { filled += ch; break; }
                // otherwise skip
            }
            if (filled.length < i + 1) break; // couldn't fill this slot
        }
        if (!filled) return '';
        const a = filled.slice(0, 4); // LL + 2 digits
        const b = filled.length > 4 ? filled.slice(4, 6) : '';
        const c = filled.length > 6 ? filled.slice(6) : '';
        let out = a;
        if (b) out += `-${b}`;
        if (c) out += `-${c}`;
        return out;
    };

    const formatTruckReg = (input?: string) => {
        if (!input) return '';
        const raw = String(input).replace(/[^0-9]/g, '');
        const d = raw.slice(0, 7); // max 7 digits
        if (d.length <= 3) return d;
        return d.slice(0, 3) + '-' + d.slice(3);
    };

    const formatContainerNo = (input?: string) => {
        if (!input) return '';
        const raw = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const letters = raw.replace(/[^A-Z]/g, '').slice(0, 4);
        const digits = raw.replace(/[^0-9]/g, '').slice(0, 7);
        if (!letters) return digits || '';
        return letters + (digits ? '-' + digits : '');
    };


    return (
        <div
            className="data-today-modal-backdrop"
            onClick={onCancel} // 👉 กด backdrop = ปิด
        >
            <div
                className="data-today-modal"
                onClick={(e) => e.stopPropagation()} // 👉 กันไม่ให้คลิกใน modal ไป trigger backdrop
            >
                <h3 className="data-today-modal-title">
                    {editing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
                </h3>

                <form
                    ref={(el) => { formRef.current = el; }}
                    onSubmit={handleLocalSubmit}
                    className="data-today-modal-form"
                >
                    <div className="data-today-modal-row">
                        <label>วันที่</label>
                        <input
                            type="date"
                            value={form.datetime_in || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange("datetime_in", e.target.value)}
                            required
                        />
                    </div>

                    <div className="data-today-modal-row">
                        <label>คนขับ</label>
                        <input
                            ref={(el) => { driverRef.current = el; }}
                            list="driver-list"
                            value={form.driver_name || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { onChange("driver_name", e.target.value); validateDriverValue(e.target.value); }}
                            onBlur={() => driverRef.current?.reportValidity()}
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
                            ref={(el) => { headRef.current = el; }}
                            pattern="^[0-9]{3}-[0-9]{4}$"
                            list="truck-head-list"
                            value={form.head_registration || ""}
                            onChange={(e) => { const v = formatTruckReg(e.target.value); onChange("head_registration", v); validateHeadValue(v); }}
                            onBlur={() => headRef.current?.reportValidity()}
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
                            ref={(el) => { tailRef.current = el; }}
                            pattern="^[0-9]{3}-[0-9]{4}$"
                            list="truck-tail-list"
                            value={form.tail_registration || ""}
                            onChange={(e) => { const v = formatTruckReg(e.target.value); onChange("tail_registration", v); validateTailValue(v); }}
                            onBlur={() => tailRef.current?.reportValidity()}
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
                            ref={(el) => { containerRef.current = el; }}
                            pattern="^[A-Z]{4}-[0-9]{7}$"
                            list="container-list"
                            value={form.container_no || ""}
                            onChange={(e) => { const v = formatContainerNo(e.target.value); onChange("container_no", v); validateContainerValue(v); }}
                            onBlur={() => containerRef.current?.reportValidity()}
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

                    <div className="data-today-modal-row">
                        <label>เลขใบสั่งงาน</label>
                        <input
                            pattern="[A-Z]{2}[0-9]{2}-[0-9]{2}-[0-9]{3}"
                            value={(form as any).booking_id || ""}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const v = formatBookingId(e.target.value);
                                onChange("booking_id" as any, v);
                            }}
                            placeholder="เช่น LL99-99-999"
                        />
                        
                    </div>

                    <div className="data-today-modal-row">
                        <label>รูปใบสั่งงาน</label>
                        <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const f = e.target.files?.[0] || null;
                                onChange("booking_image" as any, f);
                            }}
                        />
                        {(form as any).booking_image && typeof (form as any).booking_image === 'string' && (
                            <div style={{ fontSize: '0.85em', marginTop: 6 }}>
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={() => openPreviewFromUrl((form as any).booking_image)}
                                >
                                    ดูภาพที่แนบ
                                </button>
                            </div>
                        )}
                        {(form as any).booking_image && (form as any).booking_image instanceof File && (
                            <div
                                style={{ fontSize: '0.85em', marginTop: 6, textDecoration: 'underline', cursor: 'pointer' }}
                                onClick={() => openPreviewFromFile((form as any).booking_image)}
                            >
                                {(form as any).booking_image.name}
                            </div>
                        )}
                    </div>

                    <div className="data-today-modal-actions">
                        <button
                            type="button"
                            className="data-today-button-cancel"
                            onClick={onCancel}
                        >
                            ยกเลิก
                        </button>
                        <button
                            className="data-today-button-submit"
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
                        </button>
                    </div>
                </form>
                {/* Preview */}
                {previewVisible && previewSrc && (
                    <div
                        className="data-today-modal-preview-backdrop"
                        onClick={closePreview}
                    >
                        <div
                            className="data-today-modal-preview"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="data-today-modal-preview-close"
                                onClick={closePreview}
                            >
                                ปิด
                            </button>
                            {previewSrc && (
                                <img
                                    src={previewSrc}
                                    alt="preview"
                                    style={{ maxWidth: "90vw", maxHeight: "80vh" }}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
