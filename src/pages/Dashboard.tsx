import React, { useEffect, useState } from 'react';
import { fetchVehicle, VehiclePosition } from '../api/components/MapApi';
import { GoogleMap, Marker } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import '../styles/pages/Dashboard.css';

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

const DashboardHeader: React.FC = () => (
  <header className="dashboard-header">
    <h1>Dashboard</h1>
  </header>
);

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, className }) => (
  <div className={`summary-card ${className || ''}`}>
    <h2>{value}</h2>
    <p>{title}</p>
  </div>
);

// Dashboard Map Component
const DashboardMap: React.FC<{ vehicles: VehiclePosition[] }> = ({ vehicles }) => {
  const { isLoaded } = useGoogleMaps();

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
        <p>กำลังโหลดแผนที่...</p>
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
            title={`${vehicle.registration} - ${translateStatus(vehicle.statusClassName || '')}`}
          />
        );
      })}
    </GoogleMap>
  );
};

const DashboardContainer: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dashboard-container">{children}</div>
);

// ฟังก์ชันแปลสถานะเป็นภาษาไทย
const translateStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'driving': 'กำลังขับ',
    'idling': 'จอดนิ่ง',
    'stationary': 'สถานี',
    'ignition-off': 'ดับเครื่อง',
    'ignition off': 'ดับเครื่อง',
    'Driving': 'กำลังขับ',
    'Idling': 'จอดนิ่ง',
    'Stationary': 'สถานี',
    'Ignition Off': 'ดับเครื่อง',
    'Ignition-Off': 'ดับเครื่อง'
  };
  
  return statusMap[status] || status;
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
          setError('ไม่พบข้อมูลรถในระบบ กรุณาลองใหม่อีกครั้ง');
        }
      } catch (err) {
        setError('ไม่สามารถดึงข้อมูลรถได้ กรุณาลองใหม่อีกครั้ง');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <div className="dashboard-container loading">
        <div className="spinner"></div>
        <p>กำลังโหลดข้อมูล...</p>
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
        <SummaryCard title="จำนวนรถทั้งหมด" value={stats.totalVehicles} className="total" />
        <SummaryCard title="กำลับขับ" value={stats.driving} className="driving" />
        <SummaryCard title="จอดนิ่ง" value={stats.idling} className="idling" />
        <SummaryCard title="ถึงสถานี" value={stats.stationary} className="stationary" />
        <SummaryCard title="ดับเครื่อง" value={stats.ignitionOff} className="ignition-off" />
      </section>

      {/* Main Content */}
      <section className="dashboard-main">
        <div className="main-left">
          <div className="card map-container">
            <h3>ตำแหน่งรถ</h3>
            <div className="map-wrapper">
              <DashboardMap vehicles={vehicles} />
            </div>
          </div>
        </div>
      
      </section>

      {/* Data Table */}
      <section className="dashboard-table">
        <h2>บันทึกข้อมูลรถล่าสุด</h2>
        <table>
          <thead>
            <tr>
              <th>ทะเบียนรถ</th>
              <th>สถานะ</th>
              <th>เวลาที่อัปเดตล่าสุด</th>
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
                      {translateStatus(vehicle.statusClassName || '')}
                    </span>
                  </td>
                  <td>
                    {vehicle.event_ts 
                      ? new Date(vehicle.event_ts).toLocaleString('th-TH', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'ไม่มีข้อมูล'
                    }
                  </td>
                </tr>
              ))}
            {vehicles.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>
                  ไม่มีข้อมูลรถ
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
