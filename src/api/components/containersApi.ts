import axios, { AxiosError } from 'axios';
import { Containers } from '../../types/Container';

// Export types
export type { Containers };

// Type for data sent to backend (only essential fields)
export interface ContainerRequestData {
    containerNumber: string;
    companyName?: string;
    containerSize?: string;
}

// Custom API Error class
export class APIError extends Error {
    constructor(
        message: string,
        public status: number = 500,
        public code?: string
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// API Configuration - Optimized
const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
});

// Lightweight interceptors
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        const message = (error.response?.data as any)?.message || error.message || 'API Error';
        throw new APIError(message, error.response?.status || 500);
    }
);

// Container sizes constant
export const CONTAINER_SIZES = [
    { value: '40RH', label: '40RH' },
    { value: '45RH', label: '45RH' }
] as const;

// Helper function to clean container data for API requests
const cleanContainerData = (containerData: Omit<Containers, '_id'>): ContainerRequestData => {
    const cleaned = {
        containerNumber: containerData.containerNumber?.trim() || '',
        companyName: containerData.companyName?.trim() || '',
        containerSize: containerData.containerSize?.trim() || ''
    };
    
    // Validate required fields
    if (!cleaned.containerNumber) {
        throw new APIError('Container Number is required', 400);
    }
    
    // Build clean result object - only include non-empty values
    const result: ContainerRequestData = {
        containerNumber: cleaned.containerNumber
    };
    
    if (cleaned.companyName) {
        result.companyName = cleaned.companyName;
    }
    
    if (cleaned.containerSize) {
        result.containerSize = cleaned.containerSize;
    }
    
    return result;
};

// API Functions - Optimized for performance
export const fetchAllContainers = async (): Promise<Containers[]> => {
    try {
        const { data } = await api.get<Containers[]>('/containers');
        return Array.isArray(data) ? data : [];
    } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to fetch containers');
    }
};

export const fetchContainerById = async (id: string): Promise<Containers> => {
    try {
        const { data } = await api.get<Containers>(`/containers/${id}`);
        return data;
    } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to fetch container');
    }
};

export const createContainer = async (containerData: Omit<Containers, '_id'>): Promise<Containers> => {
    try {
        // Clean and extract only the essential fields for backend
        const createData = cleanContainerData(containerData);
        
        console.log('🔄 Creating container with clean data:', createData);
        
        const { data } = await api.post<{ data: Containers } | Containers>('/containers', createData);
        console.log('✅ Create response:', data);
        
        // Handle different response formats from backend
        const result = 'data' in data ? data.data : data;
        return result;
    } catch (error) {
        console.error('❌ Create container error:', error);
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to create container');
    }
}; 

export const updateContainer = async (id: string, containerData: Omit<Containers, '_id'>): Promise<Containers> => {
    try {
        // Clean and extract only the essential fields for backend
        const updateData = cleanContainerData(containerData);
        
        console.log('🔄 Updating container with clean data:', { id, updateData });
        console.log('🌐 Making PATCH request to:', `/containers/${id}`);
        
        const { data } = await api.patch<{ data: Containers } | Containers>(`/containers/${id}`, updateData);
        console.log('✅ Update response:', data);
        
        // Handle different response formats from backend
        const result = 'data' in data ? data.data : data;
        
        if (!result) {
            throw new APIError('No data returned from update operation');
        }
        
        return result;
    } catch (error: any) {
        console.error('❌ Update container error:', error);
        console.error('Error response:', error?.response);
        console.error('Error status:', error?.response?.status);
        console.error('Error data:', error?.response?.data);
        
        if (error?.response?.status === 404) {
            throw new APIError('Container not found');
        } else if (error?.response?.status === 400) {
            const message = error?.response?.data?.message || 'Invalid container data';
            throw new APIError(message);
        } else if (error?.response?.status === 409) {
            throw new APIError('Container number already exists');
        } else if (error instanceof APIError) {
            throw error;
        } else {
            throw new APIError(`Failed to update container: ${error?.message || 'Unknown error'}`);
        }
    }
};

export const deleteContainer = async (id: string): Promise<void> => {
    try {
        await api.delete(`/containers/${id}`);
    } catch (error) {
        if (error instanceof APIError) throw error;
        throw new APIError('Failed to delete container');
    }
};

export const isContainerNumberUnique = async (
    containerNumber: string, 
    excludeId?: string
): Promise<boolean> => {
    try {
        const containers = await fetchAllContainers();
        return !containers.some(container => 
            container.containerNumber === containerNumber && 
            container._id !== excludeId
        );
    } catch (error) {
        return false;
    }
};

// Helper function to preview what data will be sent to backend
export const previewContainerData = (containerData: Omit<Containers, '_id'>): ContainerRequestData => {
    return cleanContainerData(containerData);
};
