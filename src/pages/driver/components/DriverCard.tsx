// src/pages/driver/components/DriverCard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Driver } from '../../../api/components/driversApi';

type Props = {
  d: Driver;
  onEdit: (d: Driver) => void;
  onDelete: (id: string) => void;
};

export default function DriverCard({ d, onEdit, onDelete }: Props) {
  const navigate = useNavigate();

  const goProfile = () => {
    if (!d._id) return;
    navigate(`/drivers/${d._id}`);
  };

  return (
    <div className="driver-card" onClick={goProfile} role="button" tabIndex={0}>
      {!!d.profile_img && (
        <img
          src={d.profile_img}
          alt={`${d.firstName} ${d.lastName}`}
          className="profile-img"
          onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
        />
      )}

      <div className="driver-info">
        <h3>{d.firstName} {d.lastName}</h3>
        <p><strong>ตำแหน่ง :</strong> {d.position}</p>
        <p><strong>บริษัท :</strong> {d.company}</p>
        <p><strong>เบอร์โทรศัพท์ :</strong> {d.phoneNumber}</p>
      </div>

      <div className="driver-id">ID: {d._id}</div>

    </div>
  );
}
