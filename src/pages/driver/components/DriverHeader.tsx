import React from 'react';

export default function DriverHeader({ onRefresh, onAdd }: { onRefresh: () => void; onAdd: () => void }) {
  return (
    <div className="header-row">
      <h2 className="page-title">ข้อมูลคนขับ</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="refrech-driver-button" onClick={onRefresh}>🔄 รีเฟรช</button>
        <button className="add-driver-button" onClick={onAdd}>+ เพิ่มคนขับ</button>
      </div>
    </div>
  );
}