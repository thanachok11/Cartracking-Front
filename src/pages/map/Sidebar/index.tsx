import React from 'react';
import { VehiclePosition } from '../../../api/components/MapApi';
import StatusFilters from './StatusFilters';
import VehicleItem from './VehicleItem';

interface Props {
  vehicles: VehiclePosition[];
  searchTerm: string;
  onSearch: (v: string) => void;
  selectedStatuses: string[];
  onToggleStatus: (s: any) => void;
  onClickVehicle: (id: string) => void;
}

export default function Sidebar({ vehicles, searchTerm, onSearch, selectedStatuses, onToggleStatus, onClickVehicle }: Props) {
  return (
    <div className="vehicle-panel">
      <div className="vehicle-search">
        <input type="text" placeholder="ค้นหาทะเบียน..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} />
      </div>

      <StatusFilters selected={selectedStatuses} onToggle={onToggleStatus} />

      <div className="vehicle-list">
        {vehicles.map((v) => (
          <VehicleItem key={v.vehicle_id} v={v} onClick={() => onClickVehicle(v.vehicle_id)} />
        ))}
      </div>
    </div>
  );
}