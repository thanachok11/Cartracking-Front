import React from "react";

interface ExportToolbarProps {
    onExport: () => void;
    disabled?: boolean;
}

export default function ExportToolbar({ onExport, disabled }: ExportToolbarProps) {
    return (
        <>
            {/* Title */}
            <div className="data-today-title">
                <h2 className="data-today-title">เพิ่มงานและออกรายงาน</h2>
            </div>

            {/* Toolbar */}
            <div className="data-today-toolbar">
                <button
                    className="data-today-btn data-today-btn-primary"
                    onClick={onExport}
                    disabled={disabled}
                >
                    ดาวน์โหลด CSV
                </button>
            </div>
        </>
    );
}
