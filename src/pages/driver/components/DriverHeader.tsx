import React from 'react';

export default function DriverHeader({ onRefresh, onAdd }: { onRefresh: () => void; onAdd: () => void }) {
  return (
    <div className="header-row">
      <h2 className="page-title">ข้อมูลคนขับ</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="add-driver-button" onClick={onRefresh} style={{ backgroundColor: '#10b981' }}>🔄 รีเฟรช</button>
        <button className="add-driver-button" onClick={onAdd}>+ เพิ่มคนขับ</button>
      </div>
    </div>
  );
}