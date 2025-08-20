import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faMapMarkerAlt, faTachometerAlt, faUser } from '@fortawesome/free-solid-svg-icons';
import { VehiclePosition } from '../../../api/components/MapApi';
import { statusColorMap, statusTypes } from '../constants/status';

function getDriverName(vehicle: VehiclePosition) {
  return vehicle.driver_name?.name || null;
}

function getStatusColor(statusClassName: string | undefined): string {
  if (!statusClassName) return '#6c757d';
  const statusKey = statusClassName.toLowerCase().replace(/\s+/g, '-');
  return statusColorMap[statusKey] || '#6c757d';
}

function getStatusLabel(statusClassName: string | undefined): string {
  if (!statusClassName) return 'ไม่ทราบสถานะ';
  const statusKey = statusClassName.toLowerCase().replace(/\s+/g, '-');
  const statusType = statusTypes.find(s => s.key === statusKey);
  return statusType?.label || statusClassName;
}

export default function VehicleItem({ v, onClick }: { v: VehiclePosition; onClick: () => void }) {
  return (
    <div className="vehicle-item" onClick={onClick}>
      <div className="vehicle-header">
        <div className="vehicle-main-info">
          <div className="vehicle-title-status">
            <div className="registration">{v.registration}</div>
            <span 
              className={`status-badge status-${v.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ backgroundColor: getStatusColor(v.statusClassName), color: '#fff' }}
            >
              {getStatusLabel(v.statusClassName)}
            </span>
          </div>
          <div className="timestamp-speed-container">
            <div className="timestamp">
              <FontAwesomeIcon icon={faClock} />
              {v.event_ts
                ? new Date(v.event_ts).toLocaleString('th-TH', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                : '-'}
            </div>
            <div className="speed-info">
              <FontAwesomeIcon icon={faTachometerAlt} />
              <span>{v.speed != null ? `${v.speed} KM/H` : '0 KM/H'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="vehicle-location-driver-head">
        <div className="vehicle-location-driver">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <span>{v.position_description?.principal?.description || 'ไม่พบตำแหน่ง'}</span>
        </div>
      </div>
      <div className="vehicle-driver-info">
        <div className="vehicle-location-driver">
          <FontAwesomeIcon icon={faUser} />
          <span>{getDriverName(v) || 'ไม่พบข้อมูลคนขับ'}</span>
        </div>
      </div>
    </div>
  );
}
