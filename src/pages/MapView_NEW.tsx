import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow } from '@react-google-maps/api';
import { useGoogleMaps } from './GoogleMapsProvider';
import { UserRole } from '../types/User';
import '../styles/pages/MapView.css';

interface Vehicle {
  vehicle_id: string;
  name: string;
  position: {
    lat: number;
    lng: number;
  };
  status: string;
  speed?: number;
  direction?: number;
}

interface EventPanelProps {
  selectedVehicle: Vehicle | null;
  onClose: () => void;
}

const EventPanel: React.FC<EventPanelProps> = ({ selectedVehicle, onClose }) => {
  if (!selectedVehicle) return null;

  return (
    <div className="event-panel">
      <div className="event-panel-header">
        <h3>Vehicle Events</h3>
        <button onClick={onClose} className="close-btn">&times;</button>
      </div>
      <div className="event-panel-content">
        <h4>{selectedVehicle.name}</h4>
        <p><strong>Status:</strong> {selectedVehicle.status}</p>
        <p><strong>Speed:</strong> {selectedVehicle.speed || 0} km/h</p>
        <p><strong>Position:</strong> {selectedVehicle.position.lat.toFixed(6)}, {selectedVehicle.position.lng.toFixed(6)}</p>
        
        <div className="events-list">
          <div className="event-item">
            <span className="event-time">14:30</span>
            <span className="event-description">Engine started</span>
          </div>
          <div className="event-item">
            <span className="event-time">14:25</span>
            <span className="event-description">Vehicle parked</span>
          </div>
          <div className="event-item">
            <span className="event-time">14:20</span>
            <span className="event-description">Speed limit exceeded</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const MapView: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showEventPanel, setShowEventPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isLoaded } = useGoogleMaps();

  const mapContainerStyle = {
    width: '100%',
    height: '100vh'
  };

  const center = {
    lat: 13.7563,
    lng: 100.5018
  };

  // Fetch vehicles data
  const fetchVehicles = useCallback(async () => {
    try {
      const response = await fetch('/api/vehicles');
      const data = await response.json();
      setVehicles(data);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      // Mock data for development
      setVehicles([
        {
          vehicle_id: '1',
          name: 'Vehicle 001',
          position: { lat: 13.7563, lng: 100.5018 },
          status: 'online',
          speed: 45,
          direction: 180
        },
        {
          vehicle_id: '2',
          name: 'Vehicle 002',
          position: { lat: 13.7600, lng: 100.5100 },
          status: 'offline',
          speed: 0,
          direction: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
    const interval = setInterval(fetchVehicles, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [fetchVehicles]);

  const handleClick = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowEventPanel(true);
  }, []);

  const handleCloseEventPanel = useCallback(() => {
    setShowEventPanel(false);
    setSelectedVehicle(null);
  }, []);

  if (!isLoaded) {
    return <div className="loading">Loading map...</div>;
  }

  if (loading) {
    return <div className="loading">Loading vehicles...</div>;
  }

  return (
    <div className="map-view">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={12}
      >
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.vehicle_id}
            position={vehicle.position}
            onClick={() => handleClick(vehicle)}
            icon={{
              url: vehicle.status === 'online' ? '/icons/car-online.png' : '/icons/car-offline.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
          />
        ))}

        {selectedVehicle && (
          <InfoWindow
            position={selectedVehicle.position}
            onCloseClick={() => setSelectedVehicle(null)}
          >
            <div>
              <h4>{selectedVehicle.name}</h4>
              <p>Status: {selectedVehicle.status}</p>
              <p>Speed: {selectedVehicle.speed || 0} km/h</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {showEventPanel && (
        <EventPanel
          selectedVehicle={selectedVehicle}
          onClose={handleCloseEventPanel}
        />
      )}
    </div>
  );
};

export default MapView;
