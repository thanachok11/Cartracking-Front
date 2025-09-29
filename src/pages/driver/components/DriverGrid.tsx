import DriverCard from './DriverCard';
import type { Driver } from '../../../api/components/driversApi';
import { useI18n } from '../../../i18n';

export default function DriverGrid({ items, onEdit, onDelete }: { items: Driver[]; onEdit: (d: Driver) => void; onDelete: (id: string) => void }) {
  const { t } = useI18n();
  if (!items.length) return (
    <div className="no-results">
      <p>{t('drivers.noData.title')}</p>
      <p>{t('drivers.noData.subtitle')}</p>
    </div>
  );
  return (
    <div className="driver-grid">
      {items.map((d) => (
        <DriverCard key={d._id} d={d} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}