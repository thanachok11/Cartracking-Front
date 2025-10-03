import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faPlus, faFileImport } from "@fortawesome/free-solid-svg-icons";
import { useI18n } from "../../i18n";

interface Props {
    searchNumber: string;
    setSearchNumber: (v: string) => void;
    companyFilter: string;
    setCompanyFilter: (v: string) => void;
    dateFrom: string;
    setDateFrom: (v: string) => void;
    dateTo: string;
    setDateTo: (v: string) => void;
    onRefresh: () => void;
    onCreate: () => void;
    totalCount: number;
    filteredCount: number;
    onOpenImport: () => void; // ✅ เปลี่ยนจาก onImport → กดแล้วเปิด Modal
}

const WorkOrderHeader: React.FC<Props> = ({
    searchNumber,
    setSearchNumber,
    companyFilter,
    setCompanyFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    onRefresh,
    onCreate,
    totalCount,
    filteredCount,
    onOpenImport, // ✅
}) => {
    const { t } = useI18n();

    return (
        <div className="workorder-header">
            <div className="workorder-header-top">
                <h2 className="page-title">
                    {t("workorder.title")}
                    <div className="result-count">
                        {filteredCount > 0 || searchNumber || companyFilter || dateFrom || dateTo
                            ? t("workorder.resultCount", { count: filteredCount })
                            : t("workorder.totalCount", { count: totalCount })}
                    </div>
                </h2>

                <div className="workorder-header-actions">
                    <button className="refresh-workorder-button" onClick={onRefresh}>
                        <FontAwesomeIcon icon={faSync} /> {t("common.refresh")}
                    </button>

                    <button className="workorder-create-button" onClick={onCreate}>
                        <FontAwesomeIcon icon={faPlus} /> {t("workorder.createNew")}
                    </button>

                    <button
                        className="workorder-import-button"
                        onClick={onOpenImport}   // ✅ แค่ trigger modal
                    >
                        <FontAwesomeIcon icon={faFileImport} /> {t("common.import")}
                    </button>
                </div>
            </div>

            <div className="workorder-header-bottom">
                <input
                    type="text"
                    placeholder={t("workorder.searchPlaceholder")}
                    value={searchNumber}
                    onChange={(e) => setSearchNumber(e.target.value)}
                    className="search-input"
                />

                <select
                    value={companyFilter}
                    onChange={(e) => setCompanyFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="">{t("workorder.company.all")}</option>
                    <option value="ป๋อเฉิน">{t("workorder.form.header.porchoen")}</option>
                    <option value="บริษัทร่วม">{t("workorder.form.header.rotruam")}</option>
                </select>

                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="date-input"
                    title={t("workorder.fromDate")}
                />

                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="date-input"
                    title={t("workorder.toDate")}
                />
            </div>
        </div>
    );
};

export default WorkOrderHeader;
