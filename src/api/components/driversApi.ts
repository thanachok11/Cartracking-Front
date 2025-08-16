// src/api/components/driversApi.ts
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL;

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
        console.log('🔑 Using token:', token ? 'Token exists' : 'No token found');
        console.log('🌐 Calling API:', `${API_BASE_URL}/driver`);

        // Try without authentication first to see if endpoint works
        let response;
        try {
            response = await axios.get(`${API_BASE_URL}/driver`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'Content-Type': 'application/json'
                }
            });
        } catch (authError: any) {
            console.log('🔄 Auth failed, trying without token...');
            if (authError?.response?.status === 401 || authError?.response?.status === 403) {
                response = await axios.get(`${API_BASE_URL}/driver`);
            } else {
                throw authError;
            }
        }
        console.log('📡 API Response Status:', response.status);
        console.log('📋 Raw API response:', response.data);
        console.log('📊 Response type:', typeof response.data);
        console.log('🔍 Is Array?', Array.isArray(response.data));
        const data = response.data?.data || response.data;
        console.log('✅ Processed data:', data);
        console.log('📈 Data length:', Array.isArray(data) ? data.length : 'Not an array');
        return Array.isArray(data) ? data : [];
    } catch (error: any) {
        console.error('❌ Error fetching drivers:', error);
        console.error('📛 Error status:', error?.response?.status);
        console.error('📛 Error data:', error?.response?.data);
        console.error('📛 Error message:', error?.message);
        throw error;
    }
};

// Get driver by ID
export const fetchDriverById = async (id: string): Promise<Driver> => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/driver/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching driver:', error);
        throw error;
    }
};

export const createDriver = async (driverData: Omit<Driver, '_id'>, file?: File): Promise<Driver> => {
    try {
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('firstName', driverData.firstName);
        formData.append('lastName', driverData.lastName);
        formData.append('phoneNumber', driverData.phoneNumber);
        formData.append('position', driverData.position);
        formData.append('company', driverData.company);
        if (driverData.detail) formData.append('detail', driverData.detail);
        if (file) formData.append('image', file); // ต้องตรงกับ upload.single('image') ใน backend

        const response = await axios.post(`${API_BASE_URL}/driver/create`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error('Error creating driver:', error);
        throw error;
    }
};


// Update driver (แก้ไข + อัปโหลดไฟล์)
export const updateDriver = async (
    id: string,
    driverData: Partial<Omit<Driver, "_id">>,
    file?: File
): Promise<Driver> => {
    try {
        const token = localStorage.getItem("token");

        const formData = new FormData();
        if (driverData.firstName) formData.append("firstName", driverData.firstName);
        if (driverData.lastName) formData.append("lastName", driverData.lastName);
        if (driverData.phoneNumber) formData.append("phoneNumber", driverData.phoneNumber);
        if (driverData.position) formData.append("position", driverData.position);
        if (driverData.company) formData.append("company", driverData.company);
        if (driverData.detail) formData.append("detail", driverData.detail);
        if (file) formData.append("image", file);

        const response = await axios.patch(`${API_BASE_URL}/driver/${id}`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // ❌ ไม่ต้องใส่ Content-Type เดี๋ยว axios จัดการเอง
            },
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error("Error updating driver:", error);
        throw error;
    }
};

// Delete driver
export const deleteDriver = async (id: string): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_BASE_URL}/driver/${id}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error deleting driver:', error);
        throw error;
    }
};

// Get drivers from Vehicle API (Cartrack API)
export const fetchDriversFromCartrack = async (): Promise<any[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/drivers`);
        return response.data;
    } catch (error) {
        console.error('Error fetching drivers from Cartrack:', error);
        throw error;
    }
};
