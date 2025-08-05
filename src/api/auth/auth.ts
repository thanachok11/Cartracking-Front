// services/auth.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

export interface User {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user';
    profile_img?: string;
}

export interface LoginResponse {
    message: string;
    token: string;
    role: string;
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

// ฟังก์ชันสำหรับการลงทะเบียนผู้ใช้ใหม่
export const registerUser = async (userData: RegisterData) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

// ฟังก์ชันสำหรับการล็อกอินผู้ใช้
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        // Login เข้าระบบหลักของคุณ
        const response = await axios.post(`${API_BASE_URL}/auth/login`, {
            email,
            password
        });

        const loginData: LoginResponse = response.data;

        // ยิง loginContainers ต่อ (เบื้องหลัง)
        try {
            const containerRes = await axios.post(`${API_BASE_URL}/logincontainers`);
            const base64Cookie = containerRes.data.cookie;

            // เก็บ cookie ไว้ใน localStorage
            localStorage.setItem('container_cookie', base64Cookie);
            console.log('container_cookie saved');
        } catch (containerErr: any) {
            console.warn('Failed to login to container system:', containerErr?.response?.data || containerErr.message);
        }

        return loginData;

    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'User or password is incorrect');
    }
};

// Get all users
export const fetchAllUsers = async (): Promise<{ users: User[] }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
};

// Token management utilities
export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

export const isAuthenticated = (): boolean => {
    const token = getToken();
    return !!token;
};
