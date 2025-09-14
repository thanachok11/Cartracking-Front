import React, {  useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {

  faSync
} from '@fortawesome/free-solid-svg-icons';
export default function DriverHeader({ onRefresh, onAdd }: { onRefresh: () => void; onAdd: () => void }) {
      const [loading, setLoading] = useState<boolean>(true);
  
  return (
    <div className="header-row">
      <h2 className="page-title">ข้อมูลคนขับ</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="refresh-driver-button" onClick={onRefresh} >
          <FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''} />
           รีเฟรช</button>
        <button className="add-driver-button" onClick={onAdd}>+ เพิ่มคนขับ</button>
      </div>
    </div>
  );
}