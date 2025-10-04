import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../../../i18n";

interface VehicleTailHeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    totalCount: number;
    searchTerm: string;
    selectedCompany: string;
    onSearch: (v: string) => void;
    onFilter: (v: string) => void;
}

export default function VehicleTailHeader({
    onRefresh,
    onAdd,
    totalCount,
    searchTerm,
    selectedCompany,
    onSearch,
    onFilter,
}: VehicleTailHeaderProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);

    return (
        <div className="vehicle-header">
            <div className="vehicle-header-top">
                <h2 className="page-title">
                    {t('vehicles.tail.title')}
                    <div className="result-count">{t('vehicles.results', { count: String(totalCount) })}</div>
                </h2>
                <div className="header-actions">
                    <button
                        className="refresh-btn"
                        onClick={() => {
                            setLoading(true);
                            onRefresh();
                            setTimeout(() => setLoading(false), 1000);
                        }}
                    >
                        <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />
                        {t('drivers.refresh')}
                    </button>
                    <button className="add-btn" onClick={onAdd}>
                        <FontAwesomeIcon icon={faPlus} />
                        {t('vehicles.add.tail')}
                    </button>
                </div>
            </div>

            <div className="container-header-page-bottom">
                <input
                    type="text"
                    placeholder={t('vehicles.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    className="container-header-page-search-input"
                    maxLength={8}
                />
                <select
                    value={selectedCompany}
                    onChange={(e) => onFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">{t('vehicles.filter.all')}</option>
                    <option value="ป๋อเฉิน">{t('vehicles.company.porchoen')}</option>
                    <option value="รถร่วม">{t('vehicles.company.rotruam')}</option>
                </select>
            </div>
        </div>
    );
}
