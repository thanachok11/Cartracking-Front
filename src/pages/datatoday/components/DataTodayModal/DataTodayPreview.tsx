import React from "react";
import { useI18n } from "../../../../i18n";

interface DataTodayPreviewProps {
    visible: boolean;
    src: string | null;
    onClose: () => void;
}

export default function DataTodayPreview({ visible, src, onClose }: DataTodayPreviewProps) {
    const { t } = useI18n();
    if (!visible || !src) return null;

    return (
        <div className="data-today-modal-preview-backdrop" onClick={onClose}>
            <div className="data-today-modal-preview" onClick={(e) => e.stopPropagation()}>
                <button className="data-today-modal-preview-close" onClick={onClose}>✖ {t('common.close')}</button>
                {src && (
                    <img src={src} alt="preview" className="data-today-modal-preview-img" />
                )}
            </div>
        </div>
    );
}
