import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../../../i18n";

interface HeaderProps {
  onRefresh: () => void;
  onAdd: () => void;
  totalCount: number; // 👈 ยังส่งมาได้แต่ไม่ใช้แล้ว
  searchTerm: string;
  filterBy: string;
  onSearch: (v: string) => void;
  onFilter: (v: string) => void;
  resultsCount: number;
}

export default function DriverHeader({
  onRefresh,
  onAdd,
  searchTerm,
  filterBy,
  onSearch,
  onFilter,
  resultsCount,
}: HeaderProps) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);

  return (
    <div className="driver-header">
      <div className="driver-header-top">
        <h2 className="page-title">
          {t('drivers.title')}
          <div className="result-count">{t('drivers.results', { count: String(resultsCount) })}</div>
        </h2>
        <div className="header-actions">
          <button
            className="refresh-driver-button"
            onClick={() => {
              setLoading(true);
              onRefresh();
              setTimeout(() => setLoading(false), 1000);
            }}
          >
            <FontAwesomeIcon icon={faSync} className={loading ? "fa-spin" : ""} />
            {t('drivers.refresh')}
          </button>
          <button className="add-driver-button" onClick={onAdd}>
            + {t('drivers.add')}
          </button>
        </div>
      </div>

      <div className="driver-header-bottom">
        <input
          type="text"
          placeholder={t('drivers.searchPlaceholder')}
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filterBy}
          onChange={(e) => onFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">{t('drivers.filter.all')}</option>
          <option value="po-chern">{t('drivers.filter.po-chern')}</option>
          <option value="rot-ruam">{t('drivers.filter.rot-ruam')}</option>
        </select>
      </div>
    </div>
  );
}
