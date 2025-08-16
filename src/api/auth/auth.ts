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
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
            withCredentials: true
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Registration failed');
    }
};

// ฟังก์ชันสำหรับการล็อกอินผู้ใช้
export const loginUser = async (email: string, password: string): Promise<LoginResponse> => {
    try {
        // Login เข้าระบบหลัก
        const response = await axios.post(
            `${API_BASE_URL}/auth/login`,
            { email, password },
            { withCredentials: true } // ✅ สำคัญ
        );

        const loginData: LoginResponse = response.data;

        // ยิง loginContainers ต่อ
        try {
            const containerRes = await axios.post(
                `${API_BASE_URL}/loginContainers`,
                null,
                { withCredentials: true } // ✅ สำคัญ
            );

            const base64Cookie = containerRes.data.cookie;
            localStorage.setItem('container_cookie', base64Cookie);
            console.log('container_cookie saved');
        } catch (containerErr: any) {
            console.warn(
                'Failed to login to container system:',
                containerErr?.response?.data || containerErr.message
            );
        }

        return loginData;

    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'User or password is incorrect');
    }
};

// ดึงผู้ใช้ทั้งหมด
export const fetchAllUsers = async (): Promise<{ users: User[] }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true // ✅ เผื่อมี session ตรวจสอบ
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
};

// Token utils
export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
};

export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

export const removeToken = () => {
    localStorage.removeItem('token');
};

// ฟังก์ชัน logout แบบครบถ้วน
export const logoutUser = () => {
    // ลบ token และข้อมูลที่เกี่ยวข้องทั้งหมด
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('container_cookie');
    
    console.log('🚪 User logged out successfully');
};

export const isAuthenticated = (): boolean => {
    const token = getToken();
    return !!token;

};
