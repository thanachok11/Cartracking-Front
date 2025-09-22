import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSync } from "@fortawesome/free-solid-svg-icons";

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
  const [loading, setLoading] = useState(false);

  return (
    <div className="driver-header">
      <div className="driver-header-top">
        <h2 className="page-title">
          ข้อมูลคนขับ
          <div className="result-count">จำนวน {resultsCount} คน</div>
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
            รีเฟรช
          </button>
          <button className="add-driver-button" onClick={onAdd}>
            + เพิ่มคนขับ
          </button>
        </div>
      </div>

      <div className="driver-header-bottom">
        <input
          type="text"
          placeholder="ค้นหาชื่อคนขับ, บริษัท หรือตำแหน่ง..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filterBy}
          onChange={(e) => onFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">ทั้งหมด</option>
          <option value="po-chern">ป๋อเฉิน</option>
          <option value="rot-ruam">รถร่วม</option>
        </select>
      </div>
    </div>
  );
}
