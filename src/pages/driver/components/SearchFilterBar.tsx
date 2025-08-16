import React from 'react';

interface Props {
  searchTerm: string;
  filterBy: string;
  onSearch: (v: string) => void;
  onFilter: (v: string) => void;
  resultsCount: number;
}

export default function SearchFilterBar({ searchTerm, filterBy, onSearch, onFilter, resultsCount }: Props) {
  return (
    <div className="search-container">
      <div className="search-and-sort">
        <input
          type="text"
          placeholder="ค้นหาชื่อคนขับ, บริษัท หรือตำแหน่ง..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="search-input"
        />
        <select value={filterBy} onChange={(e) => onFilter(e.target.value)} className="filter-select">
          <option value="all">ทั้งหมด</option>
          <option value="po-chern">ป๋อเฉิน</option>
          <option value="rot-ruam">รถร่วม</option>
        </select>
      </div>
      {(searchTerm || filterBy !== 'all') && <p className="search-results">Found {resultsCount} driver(s)</p>}
    </div>
  );
}