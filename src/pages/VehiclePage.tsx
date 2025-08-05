import React, { useEffect, useState } from 'react';
import { fetchVehicle, VehiclePosition } from '../api/components/MapApi';
import '../styles/pages/VehiclePage.css';

const VehiclePage: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehiclePosition[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getVehicles = async () => {
            try {
                const data = await fetchVehicle();
                setVehicles(data);
                setError(null); // Clear any previous errors
            } catch (error) {
                console.error('Error fetching vehicles:', error);
                setError('ไม่สามารถเชื่อมต่อกับ API ได้ กรุณาลองใหม่อีกครั้ง');
                setVehicles([]); // Clear vehicles array
            } finally {
                setLoading(false);
            }
        };

        getVehicles();
    }, []);

    // Filter vehicles based on search term
    const filteredVehicles = vehicles.filter(vehicle =>
        vehicle.registration.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                            className="retry-button" 
                            onClick={() => window.location.reload()}
                        >
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vehicle-page">
            {/* แถวหัวเรื่อง + ปุ่ม */}
            <div className="header-row">
                <h1 className="page-title">Vehicle Data</h1>
            </div>
            {/* <button onClick={() => navigate('/drivers')} className="btn-driver-navigate">
                Drivers
            </button> */}
            
            {/* Search input */}
            <div className="search-container">
                <input
                    type="text"
                    placeholder="ระบุหมายเลขทะเบียนรถที่ต้องการค้นหา"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                {searchTerm && (
                    <p className="search-results">
                        Found {filteredVehicles.length} vehicle(s) matching "{searchTerm}"
                    </p>
                )}
            </div>
            
            {/* ตารางข้อมูลรถ */}
            <div className="vehicle-grid">
                {filteredVehicles.length === 0 && searchTerm ? (
                    <div className="no-results">
                        <p>No vehicles found matching "{searchTerm}"</p>
                        <p>Try adjusting your search term.</p>
                    </div>
                ) : (
                    filteredVehicles.map((vehicle) => (
                    <div key={vehicle.vehicle_id} className="vehicle-card">
                        <h3 className="vehicle-registration">{vehicle.registration}</h3>
                        <p><strong>Driver:</strong> {vehicle.driver_name?.name || 'No Driver Assigned'}</p>
                        <p><strong>Status:</strong> {vehicle.running_status}</p>
                        <p><strong>Speed:</strong> {vehicle.speed} km/h</p>
                        <p><strong>Ignition:</strong> {vehicle.ignition}</p>
                        <p><strong>Location:</strong> {vehicle.latitude}, {vehicle.longitude}</p>
                        <p><strong>Description:</strong> {vehicle.position_description?.principal?.description || '-'}</p>
                        <p><strong>Battery:</strong> {vehicle.alertsActions?.batteryAlerts?.batteryPercentage ?? 'N/A'}%</p>

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
                    </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default VehiclePage;
