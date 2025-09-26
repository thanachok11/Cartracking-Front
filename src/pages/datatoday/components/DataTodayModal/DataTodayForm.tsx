import React, { useEffect, useCallback } from "react";
import { DataToday } from "../../../../types/DataToday";
import { fetchWorkOrderByNumber } from "../../../../api/components/orderApi";

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
    const [loading, setLoading] = React.useState(false);
    const [validationStates, setValidationStates] = React.useState({
        booking_id: { isValid: true, checking: false },
        head_registration: { isValid: true, checking: false },
        tail_registration: { isValid: true, checking: false },
        container_no: { isValid: true, checking: false }
    });
    const timeoutRef = React.useRef<number | null>(null);

    // Input mask functions
    const formatLicensePlate = (input?: string) => {
        if (!input) return "";
        const raw = String(input).replace(/[^0-9]/g, "");
        return raw.length > 3 ? raw.slice(0, 3) + "-" + raw.slice(3, 7) : raw;
    };

    const formatContainerNumber = (input?: string) => {
        if (!input) return "";
        const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const letters = raw.slice(0, 4).replace(/[^A-Z]/g, "");
        const digits = raw.replace(/[^0-9]/g, "").slice(0, 7);
        return letters + (digits ? "-" + digits : "");
    };

    const formatWorkOrderNumber = (input?: string) => {
        if (!input) return "";
        const raw = String(input).toUpperCase().replace(/[^A-Z0-9]/g, "");
        const letters = raw.slice(0, 2).replace(/[^A-Z]/g, "");
        const digits = raw.slice(2).replace(/[^0-9]/g, "");
        return digits
            ? `${letters}${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 7)}`
            : letters;
    };

    // Validation functions
    const validateWorkOrderNumber = useCallback((value: string) => {
        if (!value) return true;
        const exists = workOrderNumbers.some(wo => 
            wo.toLowerCase() === value.toLowerCase()
        );
        return exists;
    }, [workOrderNumbers]);

    const validateHeadRegistration = useCallback((value: string) => {
        if (!value) return true;
        const exists = truckHeadRegs.some(reg => 
            reg.toLowerCase() === value.toLowerCase()
        );
        return exists;
    }, [truckHeadRegs]);

    const validateTailRegistration = useCallback((value: string) => {
        if (!value) return true;
        const exists = truckTailRegs.some(reg => 
            reg.toLowerCase() === value.toLowerCase()
        );
        return exists;
    }, [truckTailRegs]);

    const validateContainerNumber = useCallback((value: string) => {
        if (!value) return true;
        const exists = containerNumbers.some(container => 
            container.toLowerCase() === value.toLowerCase()
        );
        return exists;
    }, [containerNumbers]);

    // Handle input changes with masks and validation
    const handleHeadRegistrationChange = useCallback((value: string) => {
        const formatted = formatLicensePlate(value);
        onChange("head_registration", formatted);
        
        // Validate after a short delay
        setValidationStates(prev => ({
            ...prev,
            head_registration: { isValid: true, checking: true }
        }));
        
        setTimeout(() => {
            const isValid = validateHeadRegistration(formatted);
            setValidationStates(prev => ({
                ...prev,
                head_registration: { isValid, checking: false }
            }));
        }, 300);
    }, [onChange, validateHeadRegistration]);

    const handleTailRegistrationChange = useCallback((value: string) => {
        const formatted = formatLicensePlate(value);
        onChange("tail_registration", formatted);
        
        // Validate after a short delay
        setValidationStates(prev => ({
            ...prev,
            tail_registration: { isValid: true, checking: true }
        }));
        
        setTimeout(() => {
            const isValid = validateTailRegistration(formatted);
            setValidationStates(prev => ({
                ...prev,
                tail_registration: { isValid, checking: false }
            }));
        }, 300);
    }, [onChange, validateTailRegistration]);

    const handleContainerNumberChange = useCallback((value: string) => {
        const formatted = formatContainerNumber(value);
        onChange("container_no", formatted);
        
        // Validate after a short delay
        setValidationStates(prev => ({
            ...prev,
            container_no: { isValid: true, checking: true }
        }));
        
        setTimeout(() => {
            const isValid = validateContainerNumber(formatted);
            setValidationStates(prev => ({
                ...prev,
                container_no: { isValid, checking: false }
            }));
        }, 300);
    }, [onChange, validateContainerNumber]);

    // ฟังก์ชันสำหรับ auto-populate ข้อมูลจาก work order
    const fetchWorkOrderData = useCallback(async (workOrderNumber: string) => {
        if (!workOrderNumber.trim()) {
            return;
        }

        try {
            setLoading(true);
            console.log('🔍 Searching work order:', workOrderNumber);
            
            const workOrder = await fetchWorkOrderByNumber(workOrderNumber.trim());
            
            if (workOrder) {
                console.log('✅ Work order found:', workOrder);
                
                // Auto-populate ข้อมูลจาก work order (ตรงตามรูปที่ให้มา)
                onChange("driver_name", workOrder.driverName || "");
                onChange("head_registration", workOrder.headPlate || "");
                onChange("tail_registration", workOrder.tailPlate || "");
                onChange("container_no", workOrder.containerNumber || "");
                onChange("companyname", workOrder.companyName || "");
                
                console.log('✅ Auto-populated fields:', {
                    driver_name: workOrder.driverName,
                    head_registration: workOrder.headPlate,
                    tail_registration: workOrder.tailPlate,
                    container_no: workOrder.containerNumber,
                    companyname: workOrder.companyName
                });
            } else {
                console.log('ℹ️ Work order not found:', workOrderNumber);
            }
        } catch (error) {
            console.error('❌ Error fetching work order:', error);
            // ไม่แสดง error ให้ user เพราะอาจจะพิมพ์ยังไม่เสร็จ
        } finally {
            setLoading(false);
        }
    }, [onChange]);

    const handleWorkOrderChange = useCallback((workOrderNumber: string) => {
        // Format the work order number first
        const formatted = formatWorkOrderNumber(workOrderNumber);
        
        // อัพเดต booking_id ทันที
        onChange("booking_id" as any, formatted);
        
        // Validate work order number
        setValidationStates(prev => ({
            ...prev,
            booking_id: { isValid: true, checking: true }
        }));
        
        // Clear previous timeout
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
        
        // Set new timeout for API call and validation (debounce 500ms)
        timeoutRef.current = window.setTimeout(() => {
            // Validate work order exists
            const isValidWorkOrder = validateWorkOrderNumber(formatted);
            setValidationStates(prev => ({
                ...prev,
                booking_id: { isValid: isValidWorkOrder, checking: false }
            }));
            
            // Fetch work order data only if it's valid
            if (isValidWorkOrder && formatted.trim()) {
                fetchWorkOrderData(formatted);
            }
        }, 500) as any;
    }, [onChange, fetchWorkOrderData, validateWorkOrderNumber]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return (
        <form className="data-today-modal-form" onSubmit={onSubmit}>
            <div className="data-today-modal-row">
                <label>เลขใบสั่งงาน</label>
                <div style={{ position: 'relative' }}>
                    <input
                        list="workorder-list"
                        value={(form as any).booking_id || ""}
                        onChange={(e) => handleWorkOrderChange(e.target.value)}
                        placeholder="LL99-99-999"
                        maxLength={11}
                        style={{
                            borderColor: validationStates.booking_id.checking 
                                ? '#fbbf24' 
                                : validationStates.booking_id.isValid 
                                    ? undefined 
                                    : '#ef4444'
                        }}
                        disabled={loading}
                    />
                    {(loading || validationStates.booking_id.checking) && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: loading ? '#666' : '#f59e0b'
                        }}>
                            {loading ? 'กำลังค้นหา...' : 'ตรวจสอบ...'}
                        </div>
                    )}
                    {!validationStates.booking_id.checking && 
                     !loading &&
                     !validationStates.booking_id.isValid && 
                     (form as any).booking_id && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#ef4444'
                        }}>
                            ไม่พบข้อมูล
                        </div>
                    )}
                    <datalist id="workorder-list">
                        {workOrderNumbers.map((wo) => (
                            <option key={wo} value={wo} />
                        ))}
                    </datalist>
                </div>
            </div>

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
                <div style={{ position: 'relative' }}>
                    <input
                        list="truck-head-list"
                        value={form.head_registration || ""}
                        onChange={(e) => handleHeadRegistrationChange(e.target.value)}
                        placeholder="000-0000"
                        maxLength={8}
                        style={{
                            borderColor: validationStates.head_registration.checking 
                                ? '#fbbf24' 
                                : validationStates.head_registration.isValid 
                                    ? undefined 
                                    : '#ef4444'
                        }}
                        required
                    />
                    {validationStates.head_registration.checking && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#f59e0b'
                        }}>
                            ตรวจสอบ...
                        </div>
                    )}
                    {!validationStates.head_registration.checking && 
                     !validationStates.head_registration.isValid && 
                     form.head_registration && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#ef4444'
                        }}>
                            ไม่พบข้อมูล
                        </div>
                    )}
                    <datalist id="truck-head-list">
                        {truckHeadRegs.map((r) => (
                            <option key={r} value={r} />
                        ))}
                    </datalist>
                </div>
            </div>

            <div className="data-today-modal-row">
                <label>ทะเบียนหาง</label>
                <div style={{ position: 'relative' }}>
                    <input
                        list="truck-tail-list"
                        value={form.tail_registration || ""}
                        onChange={(e) => handleTailRegistrationChange(e.target.value)}
                        placeholder="000-0000"
                        maxLength={8}
                        style={{
                            borderColor: validationStates.tail_registration.checking 
                                ? '#fbbf24' 
                                : validationStates.tail_registration.isValid 
                                    ? undefined 
                                    : '#ef4444'
                        }}
                        required
                    />
                    {validationStates.tail_registration.checking && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#f59e0b'
                        }}>
                            ตรวจสอบ...
                        </div>
                    )}
                    {!validationStates.tail_registration.checking && 
                     !validationStates.tail_registration.isValid && 
                     form.tail_registration && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#ef4444'
                        }}>
                            ไม่พบข้อมูล
                        </div>
                    )}
                    <datalist id="truck-tail-list">
                        {truckTailRegs.map((r) => (
                            <option key={r} value={r} />
                        ))}
                    </datalist>
                </div>
            </div>

            <div className="data-today-modal-row">
                <label>หมายเลขตู้</label>
                <div style={{ position: 'relative' }}>
                    <input
                        list="container-list"
                        value={form.container_no || ""}
                        onChange={(e) => handleContainerNumberChange(e.target.value)}
                        placeholder="XXXX-0000000"
                        maxLength={12}
                        style={{
                            borderColor: validationStates.container_no.checking 
                                ? '#fbbf24' 
                                : validationStates.container_no.isValid 
                                    ? undefined 
                                    : '#ef4444'
                        }}
                        required
                    />
                    {validationStates.container_no.checking && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#f59e0b'
                        }}>
                            ตรวจสอบ...
                        </div>
                    )}
                    {!validationStates.container_no.checking && 
                     !validationStates.container_no.isValid && 
                     form.container_no && (
                        <div style={{ 
                            position: 'absolute', 
                            right: '8px', 
                            top: '50%', 
                            transform: 'translateY(-50%)',
                            fontSize: '12px',
                            color: '#ef4444'
                        }}>
                            ไม่พบข้อมูล
                        </div>
                    )}
                    <datalist id="container-list">
                        {containerNumbers.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </div>
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
