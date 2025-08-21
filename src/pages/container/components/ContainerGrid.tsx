import React from 'react';
import ContainerCard from './ContainerCard';
import { Containers } from './types';

export default function ContainerGrid({ items, onEdit, onDelete }: { items: Containers[]; onEdit: (c: Containers) => void; onDelete: (id: string) => void }) {
  if (!items.length)
    return (
      <div className="no-results">
        <h3>ไม่พบข้อมูลตู้คอนเทนเนอร์</h3>
        <p>ลองปรับคำค้นหรือเงื่อนไขการกรอง</p>
      </div>
    );

  return (
    <div className="grid-container">
      {items.map((c) => (
        <ContainerCard key={c._id} data={c} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}