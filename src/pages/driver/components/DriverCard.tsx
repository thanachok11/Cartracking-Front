// src/pages/driver/components/DriverCard.tsx
import { useNavigate } from 'react-router-dom';
import type { Driver } from '../../../api/components/driversApi';
import { useI18n } from '../../../i18n';

type Props = {
  d: Driver;
  onEdit: (d: Driver) => void;
  onDelete: (id: string) => void;
};

export default function DriverCard({ d, onEdit, onDelete }: Props) {
  const navigate = useNavigate();
  const { t } = useI18n();

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
        <p><strong>{t('drivers.form.position')} :</strong> {
            d.position === 'พนักงานขับรถ' 
                ? t('drivers.position.driver')
                : d.position === 'คนขับ' 
                    ? t('drivers.position.helper')
                    : d.position === 'คนขับ(เจ้าของ)' 
                        ? t('drivers.position.owner')
                        : d.position
        }</p>
        <p><strong>{t('drivers.form.company')} :</strong> {
            d.company === 'ป๋อเฉิน2014' 
                ? t('drivers.form.company.po-chern')
                : d.company === 'รถร่วม' 
                    ? t('drivers.form.company.rot-ruam')
                    : d.company
        }</p>
        <p><strong>{t('drivers.form.phone')} :</strong> {d.phoneNumber}</p>
      </div>

      {/* <div className="driver-id">ID: {d._id}</div> */}

    </div>
  );
}
