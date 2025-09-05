import React from "react";

interface FilterToolbarProps {
    drivers: string[];
    truckHeadRegs: string[];
    containerNumbers: string[];
    filterDriver: string;
    filterContainer: string;
    filterHeadReg: string;
    filterFrom: string;
    filterTo: string;
    onChange: {
        driver: (v: string) => void;
        container: (v: string) => void;
        headReg: (v: string) => void;
        from: (v: string) => void;
        to: (v: string) => void;
        reset: () => void;
        addNew: () => void;
    };
}

export default function FilterToolbar({
    drivers,
    truckHeadRegs,
    containerNumbers,
    filterDriver,
    filterContainer,
    filterHeadReg,
    filterFrom,
    filterTo,
    onChange,
}: FilterToolbarProps) {
    return (
        <div className="data-today-toolbar">

            <div className="data-today-toolbar-inner">
                {/* คนขับ */}
                <label className="data-today-filter-label">
                    คนขับ
                    <input
                        list="filter-driver-list"
                        value={filterDriver}
                        onChange={(e) => onChange.driver(e.target.value)}
                        placeholder="ทุกคนขับ"
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
                    หมายเลขตู้
                    <input
                        list="filter-container-list"
                        value={filterContainer}
                        onChange={(e) => onChange.container(e.target.value)}
                        placeholder="ทุกตู้"
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
                    ทะเบียนหัว
                    <input
                        list="filter-headreg-list"
                        value={filterHeadReg}
                        onChange={(e) => onChange.headReg(e.target.value)}
                        placeholder="ทุกทะเบียน"
                        className="data-today-filter-input"
                    />
                    <datalist id="filter-headreg-list">
                        {truckHeadRegs.map((r) => (
                            <option key={r} value={r} />
                        ))}
                    </datalist>
                </label>

                {/* จากวันที่ */}
                <label className="data-today-filter-label">
                    จากวันที่
                    <input
                        type="date"
                        value={filterFrom}
                        onChange={(e) => onChange.from(e.target.value)}
                        className="data-today-filter-input"
                    />
                </label>

                {/* ถึงวันที่ */}
                <label className="data-today-filter-label">
                    ถึงวันที่
                    <input
                        type="date"
                        value={filterTo}
                        onChange={(e) => onChange.to(e.target.value)}
                        className="data-today-filter-input"
                    />
                </label>

                <button className="data-today-btn data-today-btn-ghost" onClick={onChange.reset}>
                    ล้างตัวกรอง
                </button>
                <button className="data-today-button" onClick={onChange.addNew}>
                    เพิ่มรายการ
                </button>
            </div>
        </div>
    );
}
