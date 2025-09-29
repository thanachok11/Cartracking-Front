import React from "react";
import { useI18n } from "../../../i18n";

interface ExportToolbarProps {
    onExport: () => void;
    disabled?: boolean;
}

export default function ExportToolbar({ onExport, disabled }: ExportToolbarProps) {
    const { t } = useI18n();
    return (
        <div className="data-today-export-toolbar">
            <h2 className="data-today-title">{t('datatoday.title')}</h2>
            <button
                className="data-today-export-btn"
                onClick={onExport}
                disabled={disabled}
            >
                {t('datatoday.export')}
            </button>
        </div>
    );
}
