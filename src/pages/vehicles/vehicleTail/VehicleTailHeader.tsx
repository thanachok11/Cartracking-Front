import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faPlus } from "@fortawesome/free-solid-svg-icons";

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
    const [loading, setLoading] = useState(false);

    return (
        <div className="vehicle-header">
            <div className="vehicle-header-top">
                <h2 className="page-title">
                    ทะเบียนหาง
                    <div className="result-count">จำนวนทะเบียนหาง {totalCount} รายการ</div>
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
                        รีเฟรช
                    </button>
                    <button className="add-btn" onClick={onAdd}>
                        <FontAwesomeIcon icon={faPlus} />
                        เพิ่มทะเบียนหาง
                    </button>
                </div>
            </div>

            <div className="container-header-page-bottom">
                <input
                    type="text"
                    placeholder="ค้นหาหมายเลขหรือบริษัท..."
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    className="container-header-page-search-input"
                />
                <select
                    value={selectedCompany}
                    onChange={(e) => onFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">ทั้งหมด</option>
                    <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                    <option value="รถร่วม">รถร่วม</option>
                </select>
            </div>
        </div>
    );
}
