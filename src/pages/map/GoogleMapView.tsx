import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import { GoogleMap, DirectionsRenderer } from '@react-google-maps/api';
import { useGoogleMaps } from '../../pages/GoogleMapsProvider';
import Sidebar from './Sidebar';
import BottomEventPanel from './BottomEventPanel';
import { fetchVehicle, VehiclePosition, Geofence, fetchGeofences, fetchVehicleEvents } from '../../api/components/MapApi';
import { statusColorMap } from './constants/status';
import { useDirectionsFromEvents } from './hooks/useDirectionsFromEvents';
import '../../styles/pages/GoogleMapView.css'

const containerStyle = { width: '100%', height: '100%' } as const;
const defaultCenter: google.maps.LatLngLiteral = { lat: 18.7904, lng: 98.9847 };

export default function GoogleMapView() {
  const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['driving', 'idling', 'stationary', 'ignition-off']);
  const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
  const [vehicleEvents, setVehicleEvents] = useState<any[]>([]);
  const [showEventList, setShowEventList] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [sensorMap, setSensorMap] = useState<Record<string, string>>({});

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(6);
  const [panelHeight, setPanelHeight] = useState(35);
  const [isResizing, setIsResizing] = useState(false);

  const { isLoaded } = useGoogleMaps();
  const mapRef = useRef<google.maps.Map | null>(null);
  const clustererRef = useRef<MarkerClusterer | null>(null);
  const navigate = useNavigate();

  // Load vehicles & geofences
  useEffect(() => {
    const loadData = async () => {
      try {
        const [vehicleData, geofenceData] = await Promise.all([fetchVehicle(), fetchGeofences()]);
        setVehicles(vehicleData);
        setGeofences(geofenceData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
    const interval = setInterval(loadData, 20000);
    return () => clearInterval(interval);
  }, []);

  // Cluster markers based on filters
  useEffect(() => {
    if (!mapRef.current || !isLoaded) return;
    if (clustererRef.current) clustererRef.current.clearMarkers();

    let filtered = vehicles.filter((v) => {
      const matchesSearch = v.registration.toLowerCase().includes(searchTerm.toLowerCase());
      const status = v.statusClassName?.toLowerCase().replace(/\s+/g, '-');
      const matchesStatus = selectedStatuses.includes(status || '');
      return matchesSearch && matchesStatus;
    });

    if (selectedVehicle && showEventList) filtered = filtered.filter((v) => v.vehicle_id === selectedVehicle.vehicle_id);

    const markers = filtered
      .map((v) => {
        const lat = parseFloat(v.latitude);
        const lng = parseFloat(v.longitude);
        if (isNaN(lat) || isNaN(lng)) return null;

        const status = v.statusClassName?.toLowerCase().replace(/\s+/g, '-');
        const circleColor = statusColorMap[status || ''] || '#999999';

        const marker = new google.maps.Marker({
          position: { lat, lng },
          icon: { url: '/container.png', scaledSize: new google.maps.Size(50, 50), anchor: new google.maps.Point(25, 25) },
          title: `Vehicle: ${v.registration}`,
        });
        marker.addListener('click', () => {
          const today = new Date().toISOString().split('T')[0];
          navigate(`/vehicle/${v.vehicle_id}/view?date=${today}`);
        });
        return marker;
      })
      .filter(Boolean) as google.maps.Marker[];

    clustererRef.current = new MarkerClusterer({ markers, map: mapRef.current });
  }, [vehicles, searchTerm, selectedStatuses, selectedVehicle, showEventList, isLoaded]);

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.registration.toLowerCase().includes(searchTerm.toLowerCase());
    const status = v.statusClassName?.toLowerCase().replace(/\s+/g, '-');
    const matchesStatus = selectedStatuses.includes(status || '');
    return matchesSearch && matchesStatus;
  });

  async function handleClick(vehicleId: string) {
    const v = vehicles.find((x) => x.vehicle_id === vehicleId);
    if (!v) return;

    setLoadingEvents(true);
    setSelectedVehicle(v);
    setShowEventList(true);

    const lat = parseFloat(v.latitude);
    const lng = parseFloat(v.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter({ lat, lng });
      setMapZoom(16);
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const data = await fetchVehicleEvents(vehicleId, today);
      if (data) {
        const events = Array.isArray(data) ? data : (data as any)?.events || [];
        setVehicleEvents(events);
        if (!Array.isArray(data) && (data as any)?.sensorByNumber) {
          const sm = ((data as any).sensorByNumber || []).reduce((acc: Record<string, string>, s: any) => {
            acc[s.sensorNumber] = s.name;
            return acc;
          }, {});
          setSensorMap(sm);
        }
      } else setVehicleEvents([]);
    } catch (err) {
      console.error('Error fetching vehicle events:', err);
      setVehicleEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  function closeEventList() {
    setShowEventList(false);
    setSelectedVehicle(null);
    setVehicleEvents([]);
    setSensorMap({});
    setMapCenter(defaultCenter);
    setMapZoom(6);
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = panelHeight;
    const containerHeight = window.innerHeight;

    const move = (me: MouseEvent) => {
      const deltaY = startY - me.clientY;
      const deltaPct = (deltaY / containerHeight) * 100;
      const newHeight = Math.min(Math.max(startHeight + deltaPct, 20), 80);
      setPanelHeight(newHeight);
    };
    const up = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mouseup', up);
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  function toggleStatusFilter(status: string) {
    setSelectedStatuses((prev) => (prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]));
  }

  const directionsResponse = useDirectionsFromEvents(vehicleEvents, isLoaded && showEventList);

  if (!isLoaded) return <div>Loading Map...</div>;

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
      <Sidebar
        vehicles={filteredVehicles}
        searchTerm={searchTerm}
        onSearch={setSearchTerm}
        selectedStatuses={selectedStatuses}
        onToggleStatus={toggleStatusFilter}
        onClickVehicle={handleClick}
      />

      <div className={`main-content ${showEventList ? 'with-bottom-panel' : ''}`}>
        <div className={`map-container ${showEventList ? 'split-view' : ''}`} style={showEventList ? { height: `${100 - panelHeight}%` } : {}}>
          <GoogleMap mapContainerStyle={containerStyle} center={mapCenter} zoom={mapZoom} onLoad={(m) => void (mapRef.current = m)}>
            {directionsResponse && <DirectionsRenderer directions={directionsResponse} />}
          </GoogleMap>
        </div>

        {showEventList && selectedVehicle && (
          <BottomEventPanel
            selectedVehicle={selectedVehicle}
            events={vehicleEvents}
            loading={loadingEvents}
            onClose={closeEventList}
            panelHeight={panelHeight}
            onMouseDownResize={handleMouseDown}
            sensorMap={sensorMap}
            isLoaded={isLoaded}
          />
        )}
      </div>
    </div>
  );
}