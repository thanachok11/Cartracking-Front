// GoogleMapView.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from './GoogleMapsProvider';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import {
    GoogleMap,
    Marker,
    StreetViewPanorama,
    InfoWindow,
    DirectionsRenderer,
} from '@react-google-maps/api';
import { useNavigate } from 'react-router-dom';
import {
    fetchVehicle,
    VehiclePosition,
    Geofence,
    fetchGeofences,
    fetchVehicleEvents,

} from '../api/components/MapApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faStreetView, faMapMarkerAlt, faBatteryFull, faTruck, faCar, faUser, faClock, faRoad, faTachometerAlt, faExclamationTriangle, faTimes, faSpinner, faCog
} from '@fortawesome/free-solid-svg-icons';

import '../styles/pages/GoogleMapView.css';

const containerStyle = {
    width: '100%',
    height: '100%',
};

const defaultCenter = {
    lat: 18.7904,
    lng: 98.9847,
};

function getVehicleIcon(circleColor: string, imageUrl: string) {
    const svg = `
    <svg width="50" height="50" xmlns="http://www.w3.org/2000/svg">
      <circle cx="25" cy="25" r="25" fill="${circleColor}" />
      <image href="${imageUrl}" x="12" y="12" height="26" width="26" />
    </svg>
  `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const statusColorMap: Record<string, string> = {
    'driving': '#00a326',
    'idling': '#ffc107',
    'stationary': '#7dc2ff',
    'ignition-off': '#6c757d',
};

function formatDate(inputDate: string | undefined) {
    if (!inputDate) return '-';
    const d = new Date(inputDate);
    return d.toLocaleString('th-TH', {
        dateStyle: 'medium',
        timeStyle: 'medium',
    });
}

function convertFuelRawToLiters(rawValue: number) {
    return rawValue * 0.4;
}

function filterEventsLast4Hours(events: any[]): any[] {
    if (!events || events.length === 0) return [];
    
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000)); // 4 hours ago
    
    return events
        .filter(event => {
            if (!event.date && !event.event_ts) return false;
            const eventDate = new Date(event.date || event.event_ts);
            return eventDate >= fourHoursAgo && eventDate <= now;
        })
        .sort((a, b) => {
            // Sort by date descending (newest first)
            const dateA = new Date(a.date || a.event_ts);
            const dateB = new Date(b.date || b.event_ts);
            return dateB.getTime() - dateA.getTime();
        });
}

function getPositionFromEvent(event: any): string {
    const lat = event.lat || event.coords?.lat || event.latitude;
    const lon = event.lng || event.coords?.lng || event.longitude;
    
    // Check if there's a position description from API
    if (event.position_description?.principal?.description) {
        return event.position_description.principal.description;
    }
    
    // Check if there's address info in the event
    if (event.address) {
        return event.address;
    }
    
    // Check if there's location info in the event
    if (event.location) {
        return event.location;
    }
    
    // Check if there's any description field
    if (event.description) {
        return event.description;
    }
    
    // Fall back to coordinates if available
    if (lat && lon) {
        return `${lat}, ${lon}`;
    }
    
    return 'ไม่มีข้อมูลตำแหน่ง';
}

function getTimeRangeText(): string {
    const now = new Date();
    const fourHoursAgo = new Date(now.getTime() - (4 * 60 * 60 * 1000));
    
    const formatTime = (date: Date) => date.toLocaleString('th-TH', {
        timeStyle: 'short',
        dateStyle: 'short'
    });
    
    return `${formatTime(fourHoursAgo)} - ${formatTime(now)}`;
}

const GoogleMapView = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [geofences, setGeofences] = useState<Geofence[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['driving', 'idling', 'stationary', 'ignition-off']);
    const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
    const [vehicleEvents, setVehicleEvents] = useState<any[]>([]);
    const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
    const [showEventList, setShowEventList] = useState(false);
    const [loadingEvents, setLoadingEvents] = useState(false);
    const [sensorMap, setSensorMap] = useState<Record<string, string>>({});
    const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);

    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapZoom, setMapZoom] = useState(6);

    const navigate = useNavigate();
    const { isLoaded } = useGoogleMaps();
    const mapRef = useRef<google.maps.Map | null>(null);
    const clustererRef = useRef<MarkerClusterer | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [vehicleData, geofenceData] = await Promise.all([
                    fetchVehicle(),
                    fetchGeofences(),
                ]);
                setVehicles(vehicleData);
                setGeofences(geofenceData);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
        const interval = setInterval(loadData, 20000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;

        // Clear old cluster if exists
        if (clustererRef.current) {
            clustererRef.current.clearMarkers();
        }

        let filtered = vehicles.filter(vehicle => {
            const matchesSearch = vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase());
            const vehicleStatus = vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-');
            const matchesStatus = selectedStatuses.includes(vehicleStatus || '');
            return matchesSearch && matchesStatus;
        });

        // If a vehicle is selected and event list is showing, only show the selected vehicle
        if (selectedVehicle && showEventList) {
            filtered = filtered.filter(vehicle => vehicle.vehicle_id === selectedVehicle.vehicle_id);
        }

        const markers = filtered.map(vehicle => {
            const lat = parseFloat(vehicle.latitude);
            const lng = parseFloat(vehicle.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const status = vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-');
            const circleColor = statusColorMap[status] || '#999999';

            const marker = new google.maps.Marker({
                position: { lat, lng },
                icon: {
                    url:  "/container.png",
                    scaledSize: new google.maps.Size(50, 50),
                    anchor: new google.maps.Point(25, 25),
                },
                title: `Vehicle: ${vehicle.registration}`,
            });

            marker.addListener('click', () => {
                const today = new Date().toISOString().split('T')[0];
                navigate(`/vehicle/${vehicle.vehicle_id}/view?date=${today}`);
            });

            return marker;
        }).filter(Boolean) as google.maps.Marker[];

        clustererRef.current = new MarkerClusterer({ markers, map: mapRef.current });

    }, [vehicles, searchTerm, selectedStatuses, selectedVehicle, showEventList, isLoaded]);
    const filteredVehicles = vehicles.filter(vehicle => {
        const matchesSearch = vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase());
        const vehicleStatus = vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-');
        const matchesStatus = selectedStatuses.includes(vehicleStatus || '');
        return matchesSearch && matchesStatus;
    });

    const handleClick = async (vehicleId: string) => {
        const clickedVehicle = vehicles.find(v => v.vehicle_id === vehicleId);
        if (!clickedVehicle) return;

        setLoadingEvents(true);
        setSelectedVehicle(clickedVehicle);
        setShowEventList(true);

        // Zoom to selected vehicle on map
        const lat = parseFloat(clickedVehicle.latitude);
        const lng = parseFloat(clickedVehicle.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            setMapCenter({ lat, lng });
            setMapZoom(16); // Zoom closer to the vehicle
        }

        try {
            const today = new Date().toISOString().split('T')[0];
            const data = await fetchVehicleEvents(vehicleId, today);
            
            // Handle response structure similar to VehicleTimeline
            if (data) {
                // Check if data is an array (direct events) or object with events property
                const events = Array.isArray(data) ? data : ((data as any)?.events || []);
                setVehicleEvents(events);
                
                // Set sensor map if available (only when data is object)
                if (!Array.isArray(data) && (data as any)?.sensorByNumber) {
                    const sensorMapData = (data as any).sensorByNumber?.reduce((acc: Record<string, string>, sensor: any) => {
                        acc[sensor.sensorNumber] = sensor.name;
                        return acc;
                    }, {}) || {};
                    setSensorMap(sensorMapData);
                }
            } else {
                setVehicleEvents([]);
            }
        } catch (error) {
            console.error('Error fetching vehicle events:', error);
            setVehicleEvents([]);
        } finally {
            setLoadingEvents(false);
        }
    };

    // Update filtered events whenever vehicleEvents changes
    useEffect(() => {
        if (vehicleEvents && vehicleEvents.length > 0) {
            const filtered = filterEventsLast4Hours(vehicleEvents);
            setFilteredEvents(filtered);
        } else {
            setFilteredEvents([]);
        }
    }, [vehicleEvents]);

    // Create directions from filtered events
    useEffect(() => {
        if (!filteredEvents || filteredEvents.length < 2 || !isLoaded || !showEventList) {
            setDirectionsResponse(null);
            return;
        }

        // Get start point (oldest event) and end point (newest event)
        // filteredEvents is sorted newest first, so:
        const newestEvent = filteredEvents[0]; // Most recent
        const oldestEvent = filteredEvents[filteredEvents.length - 1]; // Oldest

        const startLat = parseFloat(oldestEvent.lat || oldestEvent.coords?.lat || oldestEvent.latitude);
        const startLng = parseFloat(oldestEvent.lng || oldestEvent.coords?.lng || oldestEvent.longitude);
        const endLat = parseFloat(newestEvent.lat || newestEvent.coords?.lat || newestEvent.latitude);
        const endLng = parseFloat(newestEvent.lng || newestEvent.coords?.lng || newestEvent.longitude);

        if (isNaN(startLat) || isNaN(startLng) || isNaN(endLat) || isNaN(endLng)) {
            console.log('Invalid coordinates for directions');
            return;
        }

        // Don't create directions if start and end are the same
        if (Math.abs(startLat - endLat) < 0.0001 && Math.abs(startLng - endLng) < 0.0001) {
            console.log('Start and end points are too close');
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        directionsService.route(
            {
                origin: { lat: startLat, lng: startLng },
                destination: { lat: endLat, lng: endLng },
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirectionsResponse(result);
                } else {
                    console.error(`Directions request failed due to ${status}`);
                    setDirectionsResponse(null);
                }
            }
        );
    }, [filteredEvents, isLoaded, showEventList]);

    const closeEventList = () => {
        setShowEventList(false);
        setSelectedVehicle(null);
        setVehicleEvents([]);
        setFilteredEvents([]);
        setSensorMap({});
        setDirectionsResponse(null);
        // Reset map to default view
        setMapCenter(defaultCenter);
        setMapZoom(6);
    };

    const getDriverName = (vehicle: VehiclePosition) => {
        return vehicle.driver_name?.name || null;
    };

    const toggleStatusFilter = (status: string) => {
        setSelectedStatuses(prev => {
            if (prev.includes(status)) {
                return prev.filter(s => s !== status);
            } else {
                return [...prev, status];
            }
        });
    };

    const statusTypes = [
        { key: 'driving', label: 'กำลังขับ', color: '#00a326' },
        { key: 'idling', label: 'เครื่องติด', color: '#ffc107' },
        { key: 'stationary', label: 'หยุดนิ่ง', color: '#7dc2ff' },
        { key: 'ignition-off', label: 'ปิดเครื่อง', color: '#6c757d' }
    ];

    if (!isLoaded) return <div>Loading Map...</div>;

return (
        <div style={{ width: '100%', height: '100vh', display: 'flex' }}>
            {/* Sidebar Panel */}
            <div className="vehicle-panel">
                <div className="vehicle-search">
                    <input
                        type="text"
                        placeholder="ค้นหาทะเบียน..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="status-filters">
                    <div className="filter-title">กรองตามสถานะ:</div>
                    <div className="filter-buttons">
                        {statusTypes.map(status => (
                            <button
                                key={status.key}
                                className={`filter-button ${selectedStatuses.includes(status.key) ? 'active' : ''}`}
                                style={{
                                    backgroundColor: selectedStatuses.includes(status.key) ? status.color : '#f8f9fa',
                                    color: selectedStatuses.includes(status.key) ? '#fff' : '#666',
                                    borderColor: status.color
                                }}
                                onClick={() => toggleStatusFilter(status.key)}
                            >
                                {status.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="vehicle-list">
                    {filteredVehicles.map(vehicle => (
                        <div
                            key={vehicle.vehicle_id}
                            className="vehicle-item"
                            onClick={() => handleClick(vehicle.vehicle_id)}
                        >
                            <div className="vehicle-header">
                                <div className={`status-circle status-${vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
                                    <FontAwesomeIcon icon={faTruck} style={{ color: 'white', fontSize: '16px' }} />
                                </div>
                                <div className="vehicle-main-info">
                                    <div className="registration">{vehicle.registration}</div>
                                    <span className={`status-badge status-${vehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {vehicle.statusClassName}
                                    </span>
                                </div>
                                <div className="timestamp">
                                    <FontAwesomeIcon icon={faClock} />
                                    {vehicle.event_ts ? new Date(vehicle.event_ts).toLocaleString('th-TH', {
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }) : "-"}
                                </div>
                            </div>

                            <div className="vehicle-location">
                                <FontAwesomeIcon icon={faMapMarkerAlt} />
                                <span>{vehicle.position_description?.principal?.description || 'ไม่พบตำแหน่ง'}</span>
                            </div>

                            <div className="vehicle-stats">
                                <div className="stat-item">
                                    <FontAwesomeIcon icon={faTachometerAlt} />
                                    <span>{vehicle.speed != null ? `${vehicle.speed} KM/H` : '--'}</span>
                                    <small>SPEED</small>
                                </div>
                            </div>

                            <div className="vehicle-info">
                                <div className="driver-info">
                                    <FontAwesomeIcon icon={faUser} />
                                    <span>{getDriverName(vehicle) || 'ไม่พบข้อมูลคนขับ'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`main-content ${showEventList ? 'with-bottom-panel' : ''}`}>
                {/* Google Map */}
                <div className={`map-container ${showEventList ? 'split-view' : ''}`}>
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={mapCenter}
                        zoom={mapZoom}
                        onLoad={(map) => void (mapRef.current = map)}
                    >
                        {directionsResponse && (
                            <DirectionsRenderer directions={directionsResponse} />
                        )}
                    </GoogleMap>
                </div>

                {/* Bottom Event Panel */}
                {showEventList && selectedVehicle && (
                    <div className="bottom-event-panel">
                        {/* Header */}
                        <div className="bottom-panel-header">
                            <div className="vehicle-info-header">
                                <div className={`status-circle status-${selectedVehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
                                    <FontAwesomeIcon icon={faTruck} style={{ color: 'white', fontSize: '16px' }} />
                                </div>
                                <div>
                                    <h3>{selectedVehicle.registration}</h3>
                                    <span className={`status-badge status-${selectedVehicle.statusClassName?.toLowerCase().replace(/\s+/g, '-')}`}>
                                        {selectedVehicle.statusClassName}
                                    </span>
                                </div>
                            </div>
                            <button className="close-button" onClick={closeEventList}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="bottom-panel-content">
                            {loadingEvents ? (
                                <div className="loading-container">
                                    <FontAwesomeIcon icon={faSpinner} spin />
                                    <span>กำลังโหลดข้อมูล...</span>
                                </div>
                            ) : filteredEvents.length > 0 ? (
                                <div className="events-list">
                                    <h4>Events (แสดงข้อมูลย้อนหลัง 4 ชั่วโมง - {filteredEvents.length} เหตุการณ์) - เรียงจากล่าสุด</h4>
                                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
                                        ช่วงเวลา: {getTimeRangeText()}
                                    </p>
                                    {filteredEvents.length > 5 && (
                                        <p className="scroll-hint">
                                            💡 เลื่อนลงเพื่อดูเหตุการณ์เพิ่มเติม
                                        </p>
                                    )}
                                    <div className="detailed-events-list">
                                        {filteredEvents.map((event, index) => {
                                            const lat = event.lat || event.coords?.lat || event.latitude;
                                            const lng = event.lng || event.coords?.lng || event.longitude;
                                            
                                            return (
                                                <div key={`${event.date || event.event_ts}-${lat}-${lng}-${index}`} className="detailed-event-item">
                                                    <div className="event-header">
                                                        <div className="event-time-detailed">
                                                            <FontAwesomeIcon icon={faClock} />
                                                            <strong>เวลา:</strong> {formatDate(event.date || event.event_ts)}
                                                        </div>
                                                        {event.vehicleStatus && (
                                                            <span className={`event-status-badge status-${event.vehicleStatus?.toLowerCase().replace(/\s+/g, '-')}`}>
                                                                {event.vehicleStatus}
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="event-content">
                                                        <div className="event-row">
                                                            <FontAwesomeIcon icon={faMapMarkerAlt} />
                                                            <strong>ตำแหน่ง:</strong> {getPositionFromEvent(event)}
                                                        </div>
                                                        
                                                        {event.odometer && (
                                                            <div className="event-row">
                                                                <FontAwesomeIcon icon={faTachometerAlt} />
                                                                <strong>Odometer:</strong> {event.odometer} km
                                                            </div>
                                                        )}
                                                        
                                                        {event.speed !== undefined && (
                                                            <div className="event-row">
                                                                <FontAwesomeIcon icon={faTachometerAlt} />
                                                                <strong>ความเร็ว:</strong> {event.speed} KM/H
                                                            </div>
                                                        )}
                                                        
                                                        {event.sensors && Object.keys(event.sensors).length > 0 && (
                                                            <div className="event-row sensors-row">
                                                                <FontAwesomeIcon icon={faCog} />
                                                                <strong>Sensors:</strong>
                                                                <div className="sensors-data">
                                                                    {Object.entries(event.sensors)
                                                                        .map(([sensorNumber, value]) => {
                                                                            const sensorName = sensorMap[sensorNumber] || sensorNumber;
                                                                            
                                                                            // Add units based on sensor type
                                                                            if (sensorName === 'FUEL CAPACITY') {
                                                                                const liters = convertFuelRawToLiters(Number(value));
                                                                                return `${sensorName}: ${liters.toFixed(2)} L`;
                                                                            } else if (sensorName.toLowerCase().includes('temp') || sensorName.toLowerCase().includes('temperature')) {
                                                                                return `${sensorName}: ${value} °C`;
                                                                            } else if (sensorName.toLowerCase().includes('speed')) {
                                                                                return `${sensorName}: ${value} km/h`;
                                                                            } else if (sensorName.toLowerCase().includes('voltage') || sensorName.toLowerCase().includes('volt')) {
                                                                                return `${sensorName}: ${value} V`;
                                                                            } else if (sensorName.toLowerCase().includes('battery')) {
                                                                                return `${sensorName}: ${value}%`;
                                                                            } else {
                                                                                return `${sensorName}: ${value}`;
                                                                            }
                                                                        })
                                                                        .join(', ')
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="no-events">
                                    <p>ไม่พบข้อมูลกิจกรรมสำหรับช่วง 4 ชั่วโมงที่ผ่านมา</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );

};

export default GoogleMapView;
