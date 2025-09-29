import React from "react";
import { useI18n } from "../../../i18n";

interface FilterToolbarProps {
    drivers: string[];
    truckHeadRegs: string[];
    containerNumbers: string[];
    filterDriver: string;
    filterContainer: string;
    filterHeadReg: string;
    filterBooking?: string;
    filterFrom: string;
    filterTo: string;
    onChange: {
        driver: (v: string) => void;
        container: (v: string) => void;
        headReg: (v: string) => void;
        booking?: (v: string) => void;
        from: (v: string) => void;
        to: (v: string) => void;
        reset: () => void;
        addNew: () => void;
    };
}
const formatBookingId = (input?: string) => {
    if (!input) return '';
    const raw = String(input).toUpperCase().replace(/[^A-Z0-9]/g, '');
    const patternTypes = ['L', 'L', '9', '9', '9', '9', '9', '9', '9']; // 2 letters then 7 digits
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

export default function FilterToolbar({
    drivers,
    truckHeadRegs,
    containerNumbers,
    filterDriver,
    filterContainer,
    filterHeadReg,
    filterBooking,
    filterFrom,
    filterTo,
    onChange,
}: FilterToolbarProps) {
    const { t } = useI18n();
    return (
        <div className="data-today-toolbar">

            <div className="data-today-toolbar-inner">
                {/* คนขับ */}
                <label className="data-today-filter-label">
                    {t('datatoday.filters.driver')}
                    <input
                        list="filter-driver-list"
                        value={filterDriver}
                        onChange={(e) => onChange.driver(e.target.value)}
                        placeholder={t('common.all')}
                        className="data-today-filter-input"
                    />
                    <datalist id="filter-driver-list">
                        {drivers.map((d) => (
                            <option key={d} value={d} />
                        ))}
                    </datalist>
                </label>

                {/* หมายเลขตู้ */}
                <label className="data-today-filter-label">
                    {t('datatoday.filters.container')}
                    <input
                        list="filter-container-list"
                        value={filterContainer}
                        onChange={(e) => onChange.container(e.target.value)}
                        placeholder={t('common.all')}
                        className="data-today-filter-input"
                    />
                    <datalist id="filter-container-list">
                        {containerNumbers.map((c) => (
                            <option key={c} value={c} />
                        ))}
                    </datalist>
                </label>

                {/* ทะเบียนหัว */}
                <label className="data-today-filter-label">
                    {t('datatoday.filters.headReg')}
                    <input
                        list="filter-headreg-list"
                        value={filterHeadReg}
                        onChange={(e) => onChange.headReg(e.target.value)}
                        placeholder={t('common.all')}
                        className="data-today-filter-input"
                    />
                    <datalist id="filter-headreg-list">
                        {truckHeadRegs.map((r) => (
                            <option key={r} value={r} />
                        ))}
                    </datalist>
                </label>

                {/* เลขใบสั่งงาน */}
                <label className="data-today-filter-label">
                    {t('datatoday.filters.booking')}
                    <input
                        value={filterBooking || ""}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const v = formatBookingId(e.target.value);
                            onChange.booking && onChange.booking(v);
                        }}
                        placeholder={t('workorder.form.number.placeholder')}
                        className="data-today-filter-input"
                    />
                </label>


                {/* จากวันที่ */}
                <label className="data-today-filter-label">
                    {t('datatoday.filters.from')}
                    <input
                        type="date"
                        value={filterFrom}
                        onChange={(e) => onChange.from(e.target.value)}
                        className="data-today-filter-input"
                    />
                </label>

                {/* ถึงวันที่ */}
                <label className="data-today-filter-label">
                    {t('datatoday.filters.to')}
                    <input
                        type="date"
                        value={filterTo}
                        onChange={(e) => onChange.to(e.target.value)}
                        className="data-today-filter-input"
                    />
                </label>

                <div className="data-today-toolbar-actions">
                    <button className="data-today-btn-ghost" onClick={onChange.reset}>
                        {t('datatoday.filters.reset')}
                    </button>
                    <button className="data-today-button" onClick={onChange.addNew}>
                        {t('datatoday.filters.addNew')}
                    </button>
                </div>

            </div>
        </div>
    );
}
