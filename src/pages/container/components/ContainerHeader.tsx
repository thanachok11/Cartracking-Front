import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faPlus } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../../../i18n";

interface ContainerHeaderProps {
    onRefresh: () => void;
    onAdd: () => void;
    totalCount: number;
    searchTerm: string;
    filterBy: string;
    onSearch: (v: string) => void;
    onFilter: (v: string) => void;
    resultsCount: number; // เพิ่มจำนวนผลลัพธ์ที่กรองแล้ว
}

export default function ContainerHeader({
    onRefresh,
    onAdd,
    totalCount,
    searchTerm,
    filterBy,
    onSearch,
    onFilter,
    resultsCount,
}: ContainerHeaderProps) {
    const { t } = useI18n();
    const [loading, setLoading] = useState(false);

    return (
        <div className="container-header-page">
            <div className="container-header-page-top">
                <h2 className="container-header-page-title">
                    {t('containers.title')}
                    <div className="container-header-page-count">
                        {t('containers.results', { count: String(searchTerm || filterBy !== "all" ? resultsCount : totalCount) })}
                    </div>
                </h2>
                <div className="container-header-page-actions">
                    <button
                        className="container-header-page-refresh-btn"
                        onClick={() => {
                            setLoading(true);
                            onRefresh();
                            setTimeout(() => setLoading(false), 1000);
                        }}
                    >
                        <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />
                        {t('users.refresh')}
                    </button>
                    <button
                        className="container-header-page-add-btn"
                        onClick={onAdd}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        {t('containers.add')}
                    </button>
                </div>
            </div>

            <div className="container-header-page-bottom">
                <input
                    type="text"
                    placeholder={t('containers.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    className="container-header-page-search-input"
                    maxLength={12}
                />
                <select
                    value={filterBy}
                    onChange={(e) => onFilter(e.target.value)}
                    className="container-header-page-filter-select"
                >
                    <option value="all">{t('containers.filter.all')}</option>
                    <option value="ป๋อเฉิน">{t('containers.company.porchoen')}</option>
                    <option value="บริษัทร่วม">{t('containers.company.rotruam')}</option>
                </select>
            </div>
        </div>
    );
}
