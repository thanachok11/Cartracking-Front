import axios from 'axios';
import {IWorkOrder} from "../../types/WorkOrder";
const API_BASE_URL = process.env.REACT_APP_API_URL;
const WORK_ORDERS_BASE = `${API_BASE_URL}/workorders`;


// ✅ ดึงใบสั่งงานทั้งหมด
export const fetchWorkOrders = async (): Promise<IWorkOrder[]> => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(WORK_ORDERS_BASE, {
            headers: { Authorization: `Bearer ${token || ''}` },
        });
        const data = res.data?.data || res.data;
        return Array.isArray(data) ? data : [];
    } catch (error: any) {
        console.error('❌ Error fetching work orders:', error);
        throw error;
    }
};

// ✅ ดึงใบสั่งงานตาม ID
export const fetchWorkOrderById = async (id: string): Promise<IWorkOrder> => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${WORK_ORDERS_BASE}/${id}`, {
            headers: { Authorization: `Bearer ${token || ''}` },
        });
        return res.data?.data || res.data;
    } catch (error) {
        console.error('❌ Error fetching work order:', error);
        throw error;
    }
};

// ✅ สร้างใบสั่งงานใหม่
export const createWorkOrder = async (
    payload: Omit<IWorkOrder, '_id' | 'createdAt' | 'updatedAt'>
): Promise<IWorkOrder> => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.post(WORK_ORDERS_BASE, payload, {
            headers: {
                Authorization: `Bearer ${token || ''}`,
                'Content-Type': 'application/json',
            },
        });
        return res.data?.data || res.data;
    } catch (error) {
        console.error('❌ Error creating work order:', error);
        throw error;
    }
};

// ✅ อัปเดตใบสั่งงาน
export const updateWorkOrder = async (
    id: string,
    payload: Partial<IWorkOrder>
): Promise<IWorkOrder> => {
    try {
        const token = localStorage.getItem('token');
        const res = await axios.patch(`${WORK_ORDERS_BASE}/${id}`, payload, {
            headers: {
                Authorization: `Bearer ${token || ''}`,
                'Content-Type': 'application/json',
            },
        });
        return res.data?.data || res.data;
    } catch (error) {
        console.error('❌ Error updating work order:', error);
        throw error;
    }
};

// ✅ ลบใบสั่งงาน
export const deleteWorkOrder = async (id: string): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        await axios.delete(`${WORK_ORDERS_BASE}/${id}`, {
            headers: { Authorization: `Bearer ${token || ''}` },
        });
    } catch (error) {
        console.error('❌ Error deleting work order:', error);
        throw error;
    }
};
