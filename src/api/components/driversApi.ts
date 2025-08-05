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
                // Try without auth
                response = await axios.get(`${API_BASE_URL}/driver`);
            } else {
                throw authError;
            }
        }

        console.log('📡 API Response Status:', response.status);
        console.log('📋 Raw API response:', response.data);
        console.log('📊 Response type:', typeof response.data);
        console.log('🔍 Is Array?', Array.isArray(response.data));

        // Handle different response formats
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

// Create new driver
export const createDriver = async (driverData: Omit<Driver, '_id'>): Promise<Driver> => {
    try {
        const token = localStorage.getItem('token');
        console.log('Creating driver with data:', driverData);
        const response = await axios.post(`${API_BASE_URL}/driver/create`, driverData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        console.log('Create driver response:', response.data);
        return response.data?.data || response.data;
    } catch (error) {
        console.error('Error creating driver:', error);
        throw error;
    }
};

// Update driver
export const updateDriver = async (id: string, driverData: Partial<Driver>): Promise<Driver> => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.patch(`${API_BASE_URL}/driver/${id}`, driverData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error updating driver:', error);
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
