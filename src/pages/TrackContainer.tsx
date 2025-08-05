import React, { useEffect, useState } from 'react';
import { fetchTrackContainers, loginContainers } from '../api/components/TrackContainerApi';
import { TrackContainer } from '../types/TrackContainers';

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

    if (loading) return <div>กำลังโหลดข้อมูล...</div>;
    if (error) return <div style={{ color: 'red' }}>❌ {error}</div>;

    return (
        <div>
            <h1>รายงานสถานะตู้คอนเทนเนอร์</h1>
            <table border={1} cellPadding={8} style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        <th>Container No.</th>
                        <th>สถานะ</th>
                        <th>ที่ตั้ง (Lat, Lng)</th>
                        <th>เวลาปรับปรุงล่าสุด</th>
                        <th>อุณหภูมิ (Temp)</th>
                        <th>แบตเตอรี่ (%)</th>
                        <th>รายละเอียด</th>
                    </tr>
                </thead>
                <tbody>
                    {containers.length === 0 ? (
                        <tr>
                            <td colSpan={7}>ไม่พบข้อมูล</td>
                        </tr>
                    ) : (
                        containers.map((container) => (
                            <tr key={container.devid}>
                                <td>{container.containerno}</td>
                                <td>{container.flag === '1' ? 'Active' : 'Inactive'}</td>
                                <td>{container.lat}, {container.lng}</td>
                                <td>{container.datatime}</td>
                                <td>{container.temp} °C</td>
                                <td>{container.batt} %</td>
                                <td>{container.description || '-'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TrackContainersPage;
