import React from 'react';
import DriverCard from './DriverCard';
import type { Driver } from '../../../api/components/driversApi';

export default function DriverGrid({ items, onEdit, onDelete }: { items: Driver[]; onEdit: (d: Driver) => void; onDelete: (id: string) => void }) {
  if (!items.length) return (
    <div className="no-results">
      <p>ไม่มีข้อมูลคนขับ</p>
      <p>ลองปรับเปลี่ยนตัวกรองข้อมูล</p>
    </div>
  );
  return (
    <div className="driver-grid">
      {items.map((d) => (
        <DriverCard key={d._id} d={d} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}