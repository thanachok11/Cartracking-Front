// src/api/components/driversApi.ts
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;
const DRIVER_BASE = `${API_BASE_URL}/driver`; // ✅ เอกพจน์ ให้ตรง backend

export interface Driver {
  _id?: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  position: string;
  company: string;
  detail?: string;
  profile_img?: string;
  createdBy?: string;
}

// Get all drivers
export const fetchAllDrivers = async (): Promise<Driver[]> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(DRIVER_BASE, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('❌ Error fetching drivers:', error);
    throw error;
  }
};

// Get driver by ID
export const fetchDriverById = async (id: string): Promise<Driver> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${DRIVER_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error fetching driver:', error);
    throw error;
  }
};

// Create new driver (JSON)
export const createDriver = async (driverData: Omit<Driver, '_id'>): Promise<Driver> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(`${DRIVER_BASE}/create`, driverData, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error creating driver:', error);
    throw error;
  }
};

// Create driver with image (multipart)
export const createDriverWithImage = async (
  driverData: Omit<Driver, '_id'>,
  imageFile?: File
): Promise<Driver> => {
  try {
    const token = localStorage.getItem('token');
    const fd = new FormData();
    Object.entries(driverData).forEach(([k, v]) => (v != null) && fd.append(k, String(v)));
    if (imageFile) fd.append('image', imageFile); // ชื่อ field = 'image'

    const res = await axios.post(`${DRIVER_BASE}/create`, fd, {
      headers: { Authorization: `Bearer ${token || ''}` }, // ❌ อย่าตั้ง Content-Type เอง
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error creating driver with image:', error);
    throw error;
  }
};

// Update driver (JSON) — backend ใช้ PATCH
export const updateDriver = async (id: string, driverData: Partial<Driver>): Promise<Driver> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.patch(`${DRIVER_BASE}/${id}`, driverData, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating driver:', error);
    throw error;
  }
};

// Update driver with image (multipart, PATCH)
export const updateDriverWithImage = async (
  id: string,
  driverData: Partial<Driver>,
  imageFile?: File
): Promise<Driver> => {
  try {
    const token = localStorage.getItem('token');
    const fd = new FormData();
    Object.entries(driverData).forEach(([k, v]) => (v != null) && fd.append(k, String(v)));
    if (imageFile) fd.append('image', imageFile); // ต้องตรงกับ upload.single('image')

    const res = await axios.patch(`${DRIVER_BASE}/${id}`, fd, {
      headers: { Authorization: `Bearer ${token || ''}` }, // ❌ อย่าตั้ง Content-Type เอง
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating driver with image:', error);
    throw error;
  }
};

// Delete driver
export const deleteDriver = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${DRIVER_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
  } catch (error) {
    console.error('❌ Error deleting driver:', error);
    throw error;
  }
};

// (ถ้าต้องใช้ Cartrack API แยก ให้ใช้ base อื่นตามจริง)
