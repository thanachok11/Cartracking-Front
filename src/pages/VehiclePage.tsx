import React, { useEffect, useState } from 'react';
import { fetchVehicle, VehiclePosition } from '../api/components/MapApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faTimes, 
    faUser, 
    faTachometerAlt, 
    faMapMarkerAlt, 
    faBatteryFull, 
    faCar,
    faExclamationTriangle,
    faInfoCircle,
    faIdCard,
    faNoteSticky
} from '@fortawesome/free-solid-svg-icons';
import '../styles/pages/VehiclePage.css';

const VehiclePage: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // popup โปรไฟล์รถ (ของเดิม)
    const [selectedVehicle, setSelectedVehicle] = useState<VehiclePosition | null>(null);
    const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

    // popup โน๊ต (ใหม่)
    const [isNotePopupOpen, setIsNotePopupOpen] = useState<boolean>(false);

    useEffect(() => {
        const getVehicles = async () => {
            try {
                const data = await fetchVehicle();
                setVehicles(data);
                setError(null);
            } catch (error) {
                console.error('Error fetching vehicles:', error);
                setError('ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาลองใหม่อีกครั้ง');
                setVehicles([]);
            } finally {
                setLoading(false);
            }
        };

        getVehicles();
    }, []);

    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // เปิด/ปิด popup โปรไฟล์รถ (ของเดิม)
    const openVehicleProfile = (vehicle: VehiclePosition) => {
        setSelectedVehicle(vehicle);
        setIsPopupOpen(true);
    };
    const closePopup = () => {
        setIsPopupOpen(false);
        setSelectedVehicle(null);
    };

    // เปิด/ปิด popup โน๊ต (ใหม่)
    const openNotePopup = () => setIsNotePopupOpen(true);
    const closeNotePopup = () => setIsNotePopupOpen(false);

    // Popup โปรไฟล์รถ (ของเดิม)
    const VehicleProfilePopup: React.FC<{ vehicle: VehiclePosition; onClose: () => void }> = ({ vehicle, onClose }) => {
        return (
            <div className="popup-overlay" onClick={onClose}>
                <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="popup-header">
                        <div className="popup-title">
                            <FontAwesomeIcon icon={faCar} className="popup-icon" />
                            <h2>ข้อมูลรถยนต์</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="popup-body">
                        <div className="profile-content">
                            {/* Vehicle Registration */}
                            <div className="profile-section">
                                <div className="registration-display">
                                    {vehicle.registration}
                                </div>
                                <div className="vehicle-id-display">
                                    ID: {vehicle.vehicle_id}
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="profile-section">
                                <h3>
                                    <FontAwesomeIcon icon={faInfoCircle} />
                                    สถานะรถ
                                </h3>
                                <div className="status-grid">
                                    <div className="status-item">
                                        <span className="status-label">สถานะการทำงาน:</span>
                                        <span className={`status-value status-${vehicle.running_status?.toLowerCase()}`}>
                                            {vehicle.running_status || 'ไม่ทราบ'}
                                        </span>
                                    </div>
                                    <div className="status-item">
                                        <span className="status-label">
                                            <FontAwesomeIcon icon={faTachometerAlt} />
                                            ความเร็ว:
                                        </span>
                                        <span className="status-value">{vehicle.speed || 0} km/h</span>
                                    </div>
                                </div>
                            </div>

                            {/* Driver Section */}
                            <div className="profile-section">
                                <h3>
                                    <FontAwesomeIcon icon={faUser} />
                                    ข้อมูลผู้ขับขี่
                                </h3>
                                <div className="driver-info">
                                    <span className="driver-name">
                                        {vehicle.driver_name?.name || 'ไม่มีผู้ขับขี่'}
                                    </span>
                                </div>
                            </div>

                            {/* Location Section */}
                            <div className="profile-section">
                                <h3>
                                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                                    ตำแหน่งปัจจุบัน
                                </h3>
                                <div className="location-info">
                                    <div className="location-description">
                                        {vehicle.position_description?.principal?.description || 'ไม่ทราบตำแหน่ง'}
                                    </div>
                                    <div className="coordinates">
                                        Lat: {vehicle.latitude}, Lng: {vehicle.longitude}
                                    </div>
                                </div>
                            </div>

                            {/* Battery Section */}
                            <div className="profile-section">
                                <h3>
                                    <FontAwesomeIcon icon={faBatteryFull} />
                                    สถานะแบตเตอรี่
                                </h3>
                                <div className="battery-info">
                                    <div className="battery-bar">
                                        <div 
                                            className="battery-fill" 
                                            style={{ 
                                                width: `${vehicle.alertsActions?.batteryAlerts?.batteryPercentage || 0}%`,
                                                backgroundColor: 
                                                    (vehicle.alertsActions?.batteryAlerts?.batteryPercentage || 0) > 50 ? '#4CAF50' :
                                                    (vehicle.alertsActions?.batteryAlerts?.batteryPercentage || 0) > 20 ? '#FF9800' : '#F44336'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="battery-percentage">
                                        {vehicle.alertsActions?.batteryAlerts?.batteryPercentage || 0}%
                                    </span>
                                </div>
                            </div>

                            {/* Alerts Section */}
                            {vehicle.actionAlerts?.eventType && (
                                <div className="profile-section alert-section">
                                    <h3>
                                        <FontAwesomeIcon icon={faExclamationTriangle} />
                                        การแจ้งเตือน
                                    </h3>
                                    <div className="alert-content">
                                        <div className="alert-text">
                                            {vehicle.actionAlerts.eventTypeDescription}
                                        </div>
                                        {vehicle.actionAlerts.eventTypeIcon && (
                                            <img
                                                src={vehicle.actionAlerts.eventTypeIcon}
                                                alt="alert icon"
                                                className="alert-icon"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Popup โน๊ต (ใหม่) — เปล่าๆก่อน
    const NotePopup: React.FC<{ onClose: () => void }> = ({ onClose }) => {
        return (
            <div className="popup-overlay" onClick={onClose}>
                <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                    <div className="popup-header">
                        <div className="popup-title">
                            <FontAwesomeIcon icon={faNoteSticky} className="popup-icon" />
                            <h2 style={{ margin: 0, fontSize: 18 }}>โน๊ต</h2>
                        </div>
                        <button className="close-btn" onClick={onClose}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                    <div className="popup-body">
                        {/* เว้นว่างตามที่ต้องการ */}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return <div className="loading">Loading vehicle data...</div>;

    if (error) {
        return (
            <div className="vehicle-page">
                <div className="header-row">
                    <h1 className="page-title">Vehicle Data</h1>
                </div>
                <div className="error-container">
                    <div className="error-message">
                        <h3>⚠️ การเชื่อมต่อมีปัญหา</h3>
                        <p>{error}</p>
                        <button 
                            className="retry-btn"
                            onClick={() => window.location.reload()}
                        >
                            ลองใหม่
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-page">
            <div className="header-row">
                <h1 className="page-title">Vehicle Tracking</h1>
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="ค้นหาทะเบียนรถ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            <div className="vehicle-grid">
                {filteredVehicles.length === 0 ? (
                    <div className="no-results">
                        <p>ไม่พบข้อมูลรถ{searchTerm && ` ที่มีทะเบียน "${searchTerm}"`}</p>
                    </div>
                ) : (
                    filteredVehicles.map(vehicle => (
                        <div key={vehicle.vehicle_id} className="vehicle-card">
                            <h3 className="vehicle-registration">{vehicle.registration}</h3>
                            <p><strong>คนขับ:</strong> {vehicle.driver_name?.name || 'No Driver Assigned'}</p>
                            <p><strong>สถานะ:</strong> {vehicle.running_status}</p>
                            <p><strong>ความเร็ว:</strong> {vehicle.speed} km/h</p>
                            <p><strong>ตำแหน่ง (Lat Lon):</strong> {vehicle.latitude}, {vehicle.longitude}</p>
                            <p><strong>คำอธิบายตำแหน่ง:</strong> {vehicle.position_description?.principal?.description || '-'}</p>
                            <p><strong>แบตเตอรี่ (GPS):</strong> {vehicle.alertsActions?.batteryAlerts?.batteryPercentage ?? 'N/A'}%</p>

                            <div className="vehicle-id">
                                ID: {vehicle.vehicle_id}
                            </div>

                            {vehicle.actionAlerts?.eventType && (
                                <div className="alert-box">
                                    <p><strong>Alert:</strong> {vehicle.actionAlerts.eventTypeDescription}</p>
                                    {vehicle.actionAlerts.eventTypeIcon && (
                                        <img
                                            src={vehicle.actionAlerts.eventTypeIcon}
                                            alt="event icon"
                                            className="alert-icon"
                                        />
                                    )}
                                </div>
                            )}
                            <button 
                                className="profile-btn"
                                onClick={() => { console.log('openNotePopup clicked'); setIsNotePopupOpen(true); }}
                                title="ดูโน๊ต"
                            >
                                <FontAwesomeIcon icon={faNoteSticky} />
                                <span>ดูโน๊ต</span>
                            </button>
                        </div>
                    ))
                )}
            </div>   
            {/* Note Popup (ใหม่) */}
            {isNotePopupOpen && (
                <NotePopup onClose={closeNotePopup} />
            )}
        </div>
    );
};
export default VehiclePage;
