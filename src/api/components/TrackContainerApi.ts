import axios from 'axios';
import { TrackContainer } from '../../types/TrackContainers';
const API_BASE_URL = process.env.REACT_APP_API_URL;

// Login API เพื่อให้ server login และเซ็ต cookie ใน browser อัตโนมัติ (ผ่าน withCredentials)
export const loginContainers = async (): Promise<void> => {
    await axios.post(`${API_BASE_URL}/loginContainers`, {}, { withCredentials: true });
};

// เรียก renew cookie จาก server
export const renewCookie = async (): Promise<void> => {
    await axios.post(`${API_BASE_URL}/renewCookie`, {}, { withCredentials: true });
};

// Fetch container list โดยส่ง cookie ผ่าน withCredentials
export const fetchTrackContainers = async (): Promise<TrackContainer[]> => {
    try {
        const res = await axios.get(`${API_BASE_URL}/trackContainers`, {
            withCredentials: true,
        });

        if (res.data?.success && res.data.data?.code === 0 && Array.isArray(res.data.data.data)) {
            return res.data.data.data; // ดึง array จริงจาก data.data
        }

        throw new Error('โหลดข้อมูลไม่สำเร็จ');
    } catch (err: any) {
        if (err.response?.status === 401) {
            console.warn('🔁 Cookie หมดอายุ กำลัง renew cookie ใหม่...');
            await renewCookie();

            // หลัง renew cookie แล้วลอง fetch ใหม่
            const retryRes = await axios.get(`${API_BASE_URL}/trackContainers`, {
                withCredentials: true,
            });

            if (
                retryRes.data?.success &&
                retryRes.data.data?.code === 0 &&
                Array.isArray(retryRes.data.data.data)
            ) {
                return retryRes.data.data.data;
            }

            throw new Error('โหลดข้อมูลหลัง renew cookie ไม่สำเร็จ');
        }
        throw err;
    }
};
