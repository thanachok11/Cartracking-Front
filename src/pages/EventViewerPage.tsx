import React, { useEffect, useState } from 'react';
import BottomEventPanel from './map/BottomEventPanel';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchVehicle } from '../api/components/MapApi';
import { fetchVehicleEvents } from '../api/components/MapApi';
import { filterEventsLast4Hours } from './map/utils/events';
import { useGoogleMaps } from './GoogleMapsProvider';

export default function EventViewerPage() {
  const { registration } = useParams<{ registration: string }>();
  const navigate = useNavigate();
  const { isLoaded } = useGoogleMaps();
  const [vehicle, setVehicle] = useState<any | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [panelHeight] = useState(80);

  useEffect(() => {
    const load = async () => {
      if (!registration) return;
      setLoading(true);
      try {
        const vehicles = await fetchVehicle();
        const found = (vehicles || []).find((v: any) => (v.registration || v.vehicle_id || '').toString().trim().toUpperCase().replace(/\s+/g, '') === registration.toString().trim().toUpperCase().replace(/\s+/g, ''));
        setVehicle(found || null);
        if (found) {
          const today = new Date().toISOString().split('T')[0];
          const data = await fetchVehicleEvents(found.vehicle_id, today);
          const evts = Array.isArray(data) ? data : (data as any)?.events || [];
          setEvents(filterEventsLast4Hours(evts || []));
        }
      } catch (err) {
        console.error('Failed loading events for registration', registration, err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [registration]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    // no-op for now, implemented in panel
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn" onClick={() => navigate(-1)}>กลับ</button>
        <h3>Events for {registration}</h3>
        <div />
      </div>

      <div style={{ height: 'calc(100vh - 60px)' }}>
        <BottomEventPanel
          selectedVehicle={vehicle || { registration }}
          events={events}
          loading={loading}
          onClose={() => navigate(-1)}
          panelHeight={panelHeight}
          onMouseDownResize={handleMouseDown}
          sensorMap={{}}
          isLoaded={isLoaded}
        />
      </div>
    </div>
  );
}
