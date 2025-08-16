import React, { useEffect, useState } from 'react';
import { fetchTrackContainers, loginContainers } from '../api/components/TrackContainerApi';
import { TrackContainer } from '../types/TrackContainers';
import '../styles/pages/TrackContainer.css';

const TrackContainersPage: React.FC = () => {
    const [containers, setContainers] = useState<TrackContainer[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // login ก่อน เพื่อเซ็ต cookie ใน browser
                await loginContainers();

                // ดึงข้อมูลตู้คอนเทนเนอร์
                const data = await fetchTrackContainers();
                setContainers(data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
                setContainers([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="track-container-loading">
            <div className="loading-spinner"></div>
            <span>กำลังโหลดข้อมูล...</span>
        </div>
    );
    
    if (error) return (
        <div className="track-container-error">
            <span className="error-icon">❌</span>
            <span>{error}</span>
        </div>
    );

    return (
        <div className="track-container-page">
            <div className="track-container-header">
                <h1>🚛 รายงานสถานะตู้คอนเทนเนอร์</h1>
                <div className="container-stats">
                    <div className="stat-card">
                        <span className="stat-number">{containers.length}</span>
                        <span className="stat-label">ตู้ทั้งหมด</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{containers.filter(c => c.flag === '1').length}</span>
                        <span className="stat-label">ใช้งานอยู่</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-number">{containers.filter(c => c.flag !== '1').length}</span>
                        <span className="stat-label">ไม่ใช้งาน</span>
                    </div>
                </div>
            </div>
            
            <div className="track-container-table-wrapper">
                <table className="track-container-table">
                    <thead>
                        <tr>
                            <th>เลขตู้คอนเทนเนอร์</th>
                            <th>สถานะ</th>
                            <th>ที่ตั้ง</th>
                            <th>เวลาปรับปรุงล่าสุด</th>
                            <th>อุณหภูมิ</th>
                            <th>แบตเตอรี่</th>
                            <th>รายละเอียด</th>
                        </tr>
                    </thead>
                    <tbody>
                        {containers.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="no-data">
                                    <div className="no-data-content">
                                        <span className="no-data-icon">📭</span>
                                        <span>ไม่พบข้อมูล</span>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            containers.map((container) => (
                                <tr key={container.devid} className={container.flag === '1' ? 'active' : 'inactive'}>
                                    <td>
                                        <span className="container-number">{container.containerno}</span>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${container.flag === '1' ? 'status-active' : 'status-inactive'}`}>
                                            {container.flag === '1' ? '🟢 Active' : '🔴 Inactive'}
                                        </span>
                                    </td>
                                    <td className="location-cell">
                                        <div className="location-info">
                                            <span className="coordinate">{container.lat}</span>
                                            <span className="coordinate">{container.lng}</span>
                                        </div>
                                    </td>
                                    <td className="datetime-cell">{container.datatime}</td>
                                    <td>
                                        <span className="temp-value">{container.temp}°C</span>
                                    </td>
                                    <td>
                                        <div className="battery-info">
                                            <span className="battery-percentage">{container.batt}%</span>
                                            <div className="battery-bar">
                                                <div 
                                                    className="battery-fill" 
                                                    style={{ 
                                                        width: `${container.batt}%`,
                                                        backgroundColor: Number(container.batt) > 50 ? '#4CAF50' : Number(container.batt) > 20 ? '#FF9800' : '#F44336'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="description-cell">
                                        {container.description || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


export default TrackContainersPage;
