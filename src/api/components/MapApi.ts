import axios from "axios";
import { Containers } from "../../types/Container";

export interface VehiclePosition {
    vehicle_id: string;
    latitude: string;
    longitude: string;
    registration: string;
    speed: number;
    road_speed: string;
    ignition: string;
    statusClassName: string;
    running_status: string;
    event_ts: string;
    driver_name?: { name: string | null; client_driver_id: string | null };
    position_description?: {
        principal?: { description?: string };
        alternatives?: { description_al?: string };
    };
    alertsActions?: {
        batteryAlerts?: { powerOFF?: boolean; batteryPercentage?: number };
        actionAlerts?: { actions?: any[]; actions2?: any[]; eventType?: string; eventTypeIcon?: string | null; eventTypeDescription?: string | null };
    };
    batteryAlerts?: { powerOFF?: boolean; batteryPercentage?: number };
    actionAlerts?: { actions?: any[]; actions2?: any[]; eventType?: string; eventTypeIcon?: string | null; eventTypeDescription?: string | null };
    driver_notes?: string;
}

// Shared event type used by map panels and other consumers (jobs etc.)
export interface VehicleEvent {
    // timestamp fields — map code accepts either `date` or `event_ts`
    date?: string;
    event_ts?: string;

    // location fields — map code accesses several variants
    lat?: number | string;
    lng?: number | string;
    latitude?: number | string;
    longitude?: number | string;
    coords?: { lat?: number | string; lng?: number | string };

    // common payload
    sensors?: Record<string, any>;
    vehicleStatus?: string;
    speed?: number;
    address?: string;
    location?: string;
    description?: string;
    position_description?: any;
    // allow arbitrary extra fields (actionAlerts, etc.)
    [key: string]: any;
}
export interface Driver {
    out_driver_id: string;
    out_driver_name: string;
    out_driver_surname: string;
    out_vehicle_registration: string | null;
}

export interface Geofence {
    geofence_id: string;
    geofence_name: string;
    vehicle_ids: string[];
    position_description?: { principal?: { description?: string } };
}

// ฟังก์ชันช่วยดึง token
const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token || ''}` };
};

export const fetchVehicle = async (): Promise<VehiclePosition[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/car`, {
        headers: getAuthHeader(),
    });
    return Object.values(response.data) as VehiclePosition[];
};

export const fetchVehiclePositions = async (): Promise<VehiclePosition[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/vehicles`, {
        headers: getAuthHeader(),
    });
    return Object.values(response.data) as VehiclePosition[];
};

export const fetchDrivers = async (): Promise<Driver[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/drivers`, {
        headers: getAuthHeader(),
    });
    return response.data as Driver[];
};

export const fetchGeofences = async (): Promise<Geofence[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/geofences`, {
        headers: getAuthHeader(),
    });
    return response.data as Geofence[];
};

export const fetchVehicleEvents = async (vehicleId: string, date?: string): Promise<any[]> => {
    const params = date ? `?date=${date}` : '';
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/vehicle/${vehicleId}/view${params}`, {
        headers: getAuthHeader(),
    });
    return response.data;
};

export const fetchContainers = async (): Promise<Containers[]> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/containers`, {
        headers: getAuthHeader(),
    });
    return response.data;
};

export const fetchContainerById = async (id: string): Promise<Containers> => {
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/containers/${id}`, {
        headers: getAuthHeader(),
    });
    return response.data;
};
