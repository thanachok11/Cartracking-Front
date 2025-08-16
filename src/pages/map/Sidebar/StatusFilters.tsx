import React from 'react';
import { statusTypes, StatusKey } from '../constants/status';

type Props = {
  selected: string[];
  onToggle: (status: StatusKey) => void;
};

export default function StatusFilters({ selected, onToggle }: Props) {
  return (
    <div className="status-filters">
      <div className="filter-title">กรองตามสถานะ:</div>
      <div className="filter-buttons">
        {statusTypes.map((s) => {
          const active = selected.includes(s.key);
          return (
            <button
              key={s.key}
              className={`filter-button ${active ? 'active' : ''}`}
              style={{ backgroundColor: active ? s.color : '#f8f9fa', color: active ? '#fff' : '#666', borderColor: s.color }}
              onClick={() => onToggle(s.key)}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}