import React from "react";

interface DataTodayPreviewProps {
    visible: boolean;
    src: string | null;
    onClose: () => void;
}

export default function DataTodayPreview({ visible, src, onClose }: DataTodayPreviewProps) {
    if (!visible || !src) return null;

    return (
        <div className="data-today-modal-preview-backdrop" onClick={onClose}>
            <div className="data-today-modal-preview" onClick={(e) => e.stopPropagation()}>
                <button className="data-today-modal-preview-close" onClick={onClose}>
                    ✖ ปิด
                </button>
                {src && (
                    <img src={src} alt="preview" className="data-today-modal-preview-img" />
                )}
            </div>
        </div>
    );
}
