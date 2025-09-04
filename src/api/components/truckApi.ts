import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;
const TRUCK_HEADS_BASE = `${API_BASE_URL}/truck-heads`;
const TRUCK_TAILS_BASE = `${API_BASE_URL}/truck-tails`;

export interface ITruckHead {
  _id?: string;
  licensePlate: string;
  companyName: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ITruckTail {
  _id?: string;
  licensePlate: string;
  companyName: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Truck Heads API
export const fetchTruckHeads = async (): Promise<ITruckHead[]> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(TRUCK_HEADS_BASE, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('❌ Error fetching truck heads:', error);
    throw error;
  }
};

export const fetchTruckHeadById = async (id: string): Promise<ITruckHead> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${TRUCK_HEADS_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error fetching truck head:', error);
    throw error;
  }
};

export const createTruckHead = async (payload: Omit<ITruckHead, '_id' | 'createdAt' | 'updatedAt'>): Promise<ITruckHead> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(TRUCK_HEADS_BASE, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error creating truck head:', error);
    throw error;
  }
};

export const updateTruckHead = async (id: string, payload: Partial<ITruckHead>): Promise<ITruckHead> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.patch(`${TRUCK_HEADS_BASE}/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating truck head:', error);
    throw error;
  }
};

export const deleteTruckHead = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${TRUCK_HEADS_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
  } catch (error) {
    console.error('❌ Error deleting truck head:', error);
    throw error;
  }
};

// Truck Tails API
export const fetchTruckTails = async (): Promise<ITruckTail[]> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(TRUCK_TAILS_BASE, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
    const data = res.data?.data || res.data;
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('❌ Error fetching truck tails:', error);
    throw error;
  }
};

export const fetchTruckTailById = async (id: string): Promise<ITruckTail> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.get(`${TRUCK_TAILS_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error fetching truck tail:', error);
    throw error;
  }
};

export const createTruckTail = async (payload: Omit<ITruckTail, '_id' | 'createdAt' | 'updatedAt'>): Promise<ITruckTail> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(TRUCK_TAILS_BASE, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error creating truck tail:', error);
    throw error;
  }
};

export const updateTruckTail = async (id: string, payload: Partial<ITruckTail>): Promise<ITruckTail> => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.patch(`${TRUCK_TAILS_BASE}/${id}`, payload, {
      headers: {
        Authorization: `Bearer ${token || ''}`,
        'Content-Type': 'application/json',
      },
    });
    return res.data?.data || res.data;
  } catch (error) {
    console.error('❌ Error updating truck tail:', error);
    throw error;
  }
};

export const deleteTruckTail = async (id: string): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    await axios.delete(`${TRUCK_TAILS_BASE}/${id}`, {
      headers: { Authorization: `Bearer ${token || ''}` },
    });
  } catch (error) {
    console.error('❌ Error deleting truck tail:', error);
    throw error;
  }
};
