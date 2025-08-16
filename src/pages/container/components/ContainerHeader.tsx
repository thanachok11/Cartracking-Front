import React from 'react';

export default function ContainerHeader({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="Container-header-row">
      <h2 className="section-title">จัดการตู้สินค้า</h2>
      <button className="add-container-button" onClick={onAdd}>+ เพิ่มตู้สินค้า</button>
    </div>
  );
}
