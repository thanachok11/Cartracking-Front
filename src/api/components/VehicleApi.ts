import axios from 'axios';
import { Driver } from '../../types/Driver';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export interface Vehicle {
    vehicle_id: string;
    name: string;
    position: {
        lat: number;
        lng: number;
    };
    status: string;
}

export interface VehicleTimelineEvent {
    // Define based on actual API response
    timestamp: string;
    event: string;
    location?: {
        lat: number;
        lng: number;
    };
}

// Get vehicles with positions (from Cartrack API)
export const fetchVehiclesWithPositions = async (): Promise<Vehicle[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/vehicles`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vehicles with positions:', error);
        throw error;
    }
};

// Get vehicle list
export const fetchVehicleList = async (): Promise<any[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/car`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vehicle list:', error);
        throw error;
    }
};

// Get vehicle timeline events
export const fetchVehicleTimeline = async (vehicleId: string): Promise<VehicleTimelineEvent[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/vehicle/${vehicleId}/view`);
        return response.data;
    } catch (error) {
        console.error('Error fetching vehicle timeline:', error);
        throw error;
    }
};

// Reverse geocoding
export const reverseGeocode = async (lat: number, lng: number): Promise<any> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/reverse-geocode`, {
            params: { lat, lng }
        });
        return response.data;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        throw error;
    }
};

// Get geofences
export const fetchGeofences = async (): Promise<any[]> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/geofences`);
        return response.data;
    } catch (error) {
        console.error('Error fetching geofences:', error);
        throw error;
    }
};

// Legacy driver functions (keep for backward compatibility)
export const fetchAllDrivers = async (): Promise<Driver[]> => {
    const response = await axios.get(`${API_BASE_URL}/vehicles/drivers`);
    return response.data;
};

export const fetchDriverById = async (id: string): Promise<Driver> => {
    const response = await axios.get(`${API_BASE_URL}/vehicles/drivers/${id}`);
    return response.data;
};

