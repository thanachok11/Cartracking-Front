import React, { useEffect, useMemo, useState } from 'react';
import { fetchVehicle, VehiclePosition } from '../api/components/MapApi';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import '../styles/pages/Dashboard.css';
import { useI18n } from '../i18n';

interface DashboardStats {
  totalVehicles: number;
  driving: number;
  idling: number;
  stationary: number;
  ignitionOff: number;
}

interface SummaryCardProps {
  title: string;
  value: number;
  className?: string;
}

const DashboardHeader: React.FC = () => {
  const { t } = useI18n();
  return (
    <header className="dashboard-header">
      <h1>{t('dashboard.title')}</h1>
    </header>
  );
};

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, className }) => (
  <div className={`summary-card ${className || ''}`}>
    <h2>{value}</h2>
    <p>{title}</p>
  </div>
);

// Dashboard Map Component
const DashboardMap: React.FC<{ vehicles: VehiclePosition[] }> = ({ vehicles }) => {
  const { isLoaded } = useGoogleMaps();
  const { t } = useI18n();

  const containerStyle = {
    width: '100%',
    height: '100%',
  };

  const defaultCenter = {
    lat: 18.7904,
    lng: 98.9847,
  };

  const statusColorMap: Record<string, string> = {
    'driving': '#00a326',
    'idling': '#ffc107',
    'stationary': '#00a326',
    'ignition-off': '#6c757d',
  };

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="spinner"></div>
        <p>{t('dashboard.loadingMap')}</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={6}
      options={{
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      }}
    >
      {vehicles.map((vehicle, index) => {
        const lat = parseFloat(vehicle.latitude);
        const lng = parseFloat(vehicle.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return null;

        const status = vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-');
        const color = statusColorMap[status || ''] || '#999999';

        return (
          <Marker
            key={vehicle.vehicle_id || index}
            position={{ lat, lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: color,
              fillOpacity: 0.8,
              strokeColor: '#ffffff',
              strokeWeight: 2,
            }}
            title={`${vehicle.registration} - ${statusToLabel(vehicle.statusClassName || '', t)}`}
          />
        );
      })}
    </GoogleMap>
  );
};

const DashboardContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dashboard-container">{children}</div>
);

// Normalize status then map to translation key
const normalizeStatus = (status: string) => status.toLowerCase().replace(/\s+/g, '-');
const statusToLabel = (status: string, t: (k: string, vars?: any) => string) => {
  const s = normalizeStatus(status);
  switch (s) {
    case 'driving':
      return t('vehicle.status.driving');
    case 'idling':
      return t('vehicle.status.idling');
    case 'stationary':
      return t('vehicle.status.stationary');
    case 'ignition-off':
    case 'ignition':
    case 'ignitionoff':
      return t('vehicle.status.ignitionOff');
    default:
      return status;
  }
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalVehicles: 0,
    driving: 0,
    idling: 0,
    stationary: 0,
    ignitionOff: 0,
  });
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t, lang } = useI18n();
  const locale = useMemo(() => (lang === 'th' ? 'th-TH' : lang === 'zh' ? 'zh-CN' : 'en-US'), [lang]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const vehiclesData: VehiclePosition[] = await fetchVehicle();
        
        // เก็บข้อมูลรถไว้ใน state
        setVehicles(vehiclesData);

        const statusCount = vehiclesData.reduce(
          (acc, { statusClassName }) => {
            const status = statusClassName?.toLowerCase().replace(/\s+/g, '-');
            switch (status) {
              case 'driving':
                acc.driving++;
                break;
              case 'idling':
                acc.idling++;
                break;
              case 'stationary':
                acc.stationary++;
                break;
              case 'ignition-off':
                acc.ignitionOff++;
                break;
              default:
                break;
            }
            return acc;
          },
          { driving: 0, idling: 0, stationary: 0, ignitionOff: 0 }
        );

        setStats({
          totalVehicles: vehiclesData.length,
          ...statusCount,
        });

        if (vehiclesData.length === 0) {
          setError(t('dashboard.noVehicles'));
        }
      } catch (err) {
        setError(t('dashboard.loadingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="dashboard-container loading">
        <div className="spinner"></div>
        <p>{t('dashboard.loadingData')}</p>
      </div>
    );

  if (error)
    return (
      <div className="dashboard-container error">
        <p>{error}</p>
      </div>
    );

  return (
    <DashboardContainer>
  <DashboardHeader />

      {/* Summary Cards */}
      <section className="dashboard-summary">
        <SummaryCard title={t('dashboard.totalVehicles')} value={stats.totalVehicles} className="total" />
        <SummaryCard title={t('dashboard.driving')} value={stats.driving} className="driving" />
        <SummaryCard title={t('dashboard.idling')} value={stats.idling} className="idling" />
        <SummaryCard title={t('dashboard.stationary')} value={stats.stationary} className="stationary" />
        <SummaryCard title={t('dashboard.ignitionOff')} value={stats.ignitionOff} className="ignition-off" />
      </section>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="main-left">
          <div className="card map-container">
            <h3>{t('dashboard.mapTitle')}</h3>
            <div className="map-wrapper">
              <DashboardMap vehicles={vehicles} />
            </div>
          </div>
        </div>
      
      </section>

      {/* Data Table */}
      <section className="dashboard-table">
        <h2>{t('dashboard.table.title')}</h2>
        <table>
          <thead>
            <tr>
              <th>{t('dashboard.table.registration')}</th>
              <th>{t('dashboard.table.status')}</th>
              <th>{t('dashboard.table.lastUpdated')}</th>
            </tr>
          </thead>
          <tbody>
            {vehicles
              .sort((a, b) => {
                // เรียงตามเวลาล่าสุดก่อน
                const timeA = new Date(a.event_ts || 0).getTime();
                const timeB = new Date(b.event_ts || 0).getTime();
                return timeB - timeA;
              })
              .slice(0, 10) // แสดงแค่ 10 รายการล่าสุด
              .map((vehicle, index) => (
                <tr key={vehicle.vehicle_id || index}>
                  <td>{vehicle.registration}</td>
                  <td>
                    <span className={`status-badge ${vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {statusToLabel(vehicle.statusClassName || '', t)}
                    </span>
                  </td>
                  <td>
                    {vehicle.event_ts 
                      ? new Date(vehicle.event_ts).toLocaleString(locale, {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : t('common.noData')
                    }
                  </td>
                </tr>
              ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>
                  {t('dashboard.noVehicles')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </DashboardContainer>
  );
};

export default Dashboard;
