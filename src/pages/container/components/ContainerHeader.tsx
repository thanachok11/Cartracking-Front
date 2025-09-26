import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync, faPlus } from "@fortawesome/free-solid-svg-icons";

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
    const [loading, setLoading] = useState(false);

    return (
        <div className="container-header-page">
            <div className="container-header-page-top">
                <h2 className="container-header-page-title">
                    ตู้คอนเทนเนอร์
                    <div className="container-header-page-count">
                        {searchTerm || filterBy !== "all" ? (
                            `แสดง ${resultsCount} ตู้`
                        ) : (
                            `ทั้งหมด ${totalCount} ตู้`
                        )}
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
                        รีเฟรช
                    </button>
                    <button
                        className="container-header-page-add-btn"
                        onClick={onAdd}
                    >
                        <FontAwesomeIcon icon={faPlus} />
                        เพิ่มตู้คอนเทนเนอร์
                    </button>
                </div>
            </div>

            <div className="container-header-page-bottom">
                <input
                    type="text"
                    placeholder="ค้นหาหมายเลขตู้หรือบริษัท..."
                    value={searchTerm}
                    onChange={(e) => onSearch(e.target.value)}
                    className="container-header-page-search-input"
                />
                <select
                    value={filterBy}
                    onChange={(e) => onFilter(e.target.value)}
                    className="container-header-page-filter-select"
                >
                    <option value="all">ทั้งหมด</option>
                    <option value="ป๋อเฉิน">ป๋อเฉิน</option>
                    <option value="รถร่วม">รถร่วม</option>
                </select>
            </div>
        </div>
    );
}
