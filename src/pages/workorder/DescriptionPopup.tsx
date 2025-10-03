import React from "react";
import { useI18n } from "../../i18n";

interface Props {
    description: string;
    onClose: () => void;
}

const DescriptionPopup: React.FC<Props> = ({ description, onClose }) => {
    const { t } = useI18n();
    return (
        <div className="description-popup-backdrop" onClick={onClose}>
            <div className="description-popup" onClick={(e) => e.stopPropagation()}>
                <div className="description-popup-header">
                    <h3>{t('workorder.description.title')}</h3>
                    <button className="description-popup-close" onClick={onClose}>
                        ✖ {t('common.close')}
                    </button>
                </div>
                <div className="description-popup-content">
                    <p>{description}</p>
                </div>
            </div>
        </div>
    );
};

export default DescriptionPopup;
