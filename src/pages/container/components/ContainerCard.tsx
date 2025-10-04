import React from 'react';
import { Containers } from './types';

interface Props {
  data: Containers;
  onEdit: (c: Containers) => void;
  onDelete: (id: string) => void;
}

export default function ContainerCard({ data, onEdit, onDelete }: Props) {
  return (
    <div className="card" key={data._id}>
      <h3>{data.containerNumber || 'N/A'}</h3>
      <p><strong>บริษัท:</strong> {data.companyName || 'N/A'}</p>
      <p><strong>ขนาด:</strong> {data.containerSize || 'N/A'}</p>
      <div className="container-id">ID: {data._id}</div>
      <div className="card-actions">
        <button className="btn-edit" onClick={() => onEdit(data)}>แก้ไข</button>
        <button className="btn-delete" onClick={() => data._id && onDelete(data._id)}>ลบ</button>
      </div>
    </div>
  );
}
