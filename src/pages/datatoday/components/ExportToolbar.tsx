import React from "react";

interface ExportToolbarProps {
    onExport: () => void;
    disabled?: boolean;
}

export default function ExportToolbar({ onExport, disabled }: ExportToolbarProps) {
    return (
        <div className="data-today-export-toolbar">
            <h2 className="data-today-title">เพิ่มงานและออกรายงาน</h2>
            <button
                className="data-today-export-btn"
                onClick={onExport}
                disabled={disabled}
            >
                ดาวน์โหลด
            </button>
        </div>
    );
}
