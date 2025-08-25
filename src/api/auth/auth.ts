import axios from 'axios';
import { User, getRolePermissions, UserRole } from '../../types/User';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('🔗 Auth API_BASE_URL:', API_BASE_URL);

export interface LoginResponse {
    message: string;
    token: string;
    role: string;
    user: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        role: string;
        profile_img?: string;
    };
}

export interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface RegisterWithRoleData extends RegisterData {
    role: string; // role เป็น string สำหรับส่งไป API
}

// ฟังก์ชันสำหรับการลงทะเบียนผู้ใช้ใหม่ (สำหรับผู้ใช้ทั่วไป)
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

// ฟังก์ชันสำหรับการเพิ่มผู้ใช้ใหม่โดย Admin (มีการกำหนด role)
export const createUserByAdmin = async (userData: RegisterWithRoleData) => {
    try {
        console.log('🔍 Creating user via admin register API:', userData);
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/register`, userData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });
        
        console.log('✅ User created successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error creating user:', error);
        throw new Error(error.response?.data?.message || 'การสร้างผู้ใช้ใหม่ล้มเหลว');
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

        // เก็บ token และข้อมูลผู้ใช้
        if (loginData.token) {
            saveToken(loginData.token);
        }

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

// ดึงผู้ใช้ทั้งหมด - ใช้ API endpoint ที่ถูกต้องตาม backend
export const fetchAllUsers = async (): Promise<{ users: User[] }> => {
    try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/auth/users`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        console.log('📋 Raw users from backend:', response.data);

        // ดึง role ของ user ปัจจุบันจาก token หรือ backend
        const currentUserRole = localStorage.getItem('role')?.toLowerCase();
        // หรือดึงจาก JWT decode ก็ได้

        // กำหนด type ให้ users เป็น array ของ User
        let users: User[] = response.data.users.map((user: any) => {
            let userRole = UserRole.LEVEL_2; // default
            switch (user.role?.toLowerCase()) {
                case 'super admin':
                    userRole = UserRole.LEVEL_5;
                    break;
                case 'admin':
                    userRole = UserRole.LEVEL_4;
                    break;
                case 'manager':
                    userRole = UserRole.LEVEL_3;
                    break;
                case 'user':
                    userRole = UserRole.LEVEL_2;
                    break;
                case 'viewer':
                    userRole = UserRole.LEVEL_1;
                    break;
                default:
                    userRole = UserRole.LEVEL_2;
            }
            return {
                id: user._id || user.id,
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                email: user.email,
                role: userRole,
                createdAt: user.createdAt || new Date().toISOString(),
                lastLogin: user.lastLogin || user.updatedAt || new Date().toISOString(),
                isActive: user.isActive !== false,
                profile_img: user.profile_img || 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg'
            };
        });

        // กรอง super admin ถ้า currentUser ไม่ใช่ super admin
        if (currentUserRole !== 'super admin') {
            users = users.filter((u: User) => u.role !== UserRole.LEVEL_5);
        }

        console.log('✅ Converted users for frontend:', users);
        return { users };
    } catch (error: any) {
        console.error('❌ Error fetching users:', error);
        throw new Error(error.response?.data?.message || 'Failed to fetch users');
    }
};

// สร้างผู้ใช้ใหม่โดย Admin/Manager - ปรับตาม backend requirements
export const createUser = async (userData: RegisterWithRoleData) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        // Get current user role from token
        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        const currentUserRole = decoded.role;

        const requestBody = {
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role, // ใช้ role ที่ส่งมาจาก form
            currentUserRole: currentUserRole // Add current user role for backend validation
        };

        console.log('🔍 Create user request body:', requestBody);

        // ลองใช้ endpoint ที่แตกต่างกัน
        const response = await axios.post(`${API_BASE_URL}/auth/register`, requestBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        console.log('✅ User created successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error creating user:', error);
        throw new Error(error.response?.data?.message || 'การสร้างผู้ใช้ใหม่ล้มเหลว');
    }
};

// อัพเดตข้อมูลผู้ใช้ - ใช้ PATCH /auth/update ที่มีอยู่ใน backend
export const updateUser = async (userId: string, userData: { firstName: string; lastName: string; }) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        const currentUserId = decoded.userId || decoded.id;

        // ส่งเฉพาะข้อมูลส่วนตัว ไม่ส่ง role เหมือน usermanagement
        const requestBody = {
            targetUserId: userId,
            userId: currentUserId,
            firstName: userData.firstName,
            lastName: userData.lastName,
        };

        console.log('🔍 Update user request body:', requestBody);

        // ใช้ PUT /users/update สำหรับอัปเดตข้อมูลทั่วไป
        const response = await axios.patch(`${API_BASE_URL}/auth/update`, requestBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        console.log('✅ User updated successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error updating user:', error);
        console.error('❌ Error response:', error.response?.data);
        throw new Error(error.response?.data?.message || 'การอัพเดตผู้ใช้ล้มเหลว');
    }
};
// อัพเดตสถานะการใช้งานผู้ใช้ (isActive)
export const updateStatus = async (userId: string, isActive: boolean) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        const currentUserId = decoded.userId || decoded.id;

        const requestBody = {
            targetUserId: userId,
            userId: currentUserId,
            isActive: isActive,
        };

        console.log('🔍 Update status request body:', requestBody);

        const response = await axios.patch(
            `${API_BASE_URL}/auth/update-status`,
            requestBody,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                withCredentials: true
            }
        );


        console.log(`✅ User status updated to ${isActive ? 'Active' : 'Inactive'}:`, response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error updating user status:', error);
        throw new Error(error.response?.data?.message || 'การอัปเดตสถานะผู้ใช้ล้มเหลว');
    }
};

// ลบผู้ใช้ - ปรับตาม backend requirements
export const deleteUser = async (userId: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        // Get current user role from token
        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        const currentUserRole = decoded.role;

        const response = await axios.delete(`${API_BASE_URL}/auth/delete`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            data: {
                userId: userId,
                role: currentUserRole // ส่ง role ของ current user สำหรับ permission check
            },
            withCredentials: true
        });

        return response.data;
    } catch (error: any) {
        console.error('❌ Error deleting user:', error);
        throw new Error(error.response?.data?.message || 'การลบผู้ใช้ล้มเหลว');
    }
};

// อัพเดต role ของผู้ใช้ - ใช้หลาย endpoint สำหรับความเข้ากันได้
export const updateUserRole = async (userId: string, newRole: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        // Get current user role from token
        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        const currentUserId = decoded.userId || decoded.id;
        const currentUserRole = decoded.role;

        // ตรวจสอบสิทธิ์ใน frontend ก่อน
        if (currentUserRole !== 'super admin' && currentUserRole !== 'admin') {
            throw new Error('คุณไม่มีสิทธิ์ในการแก้ไข role ของผู้ใช้');
        }

        const requestBody = {
            userId: currentUserId,
            targetUserId: userId,
            newRole: newRole,
            currentUserId: currentUserId,
            role: currentUserRole  // เปลี่ยนจาก currentUserRole เป็น role ตาม middleware
        };

        console.log('🔍 Update role request body:', requestBody);

        // ใช้ PATCH endpoint ตาม backend routes
        const response = await axios.patch(`${API_BASE_URL}/auth/update`, requestBody, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        console.log('✅ Role updated successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error updating role:', error);
        console.error('❌ Error response:', error.response?.data);
        throw new Error(error.response?.data?.message || 'การอัพเดต role ล้มเหลว');
    }
};

// ตรวจสอบสิทธิ์ของผู้ใช้
export const getUserPermissions = async (): Promise<{ user: any; permissions: any }> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        // Decode JWT token to get user info
        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        
        console.log('🔍 JWT decoded data:', decoded);

        const userPermissions = {
            userId: decoded.userId || decoded.id,
            email: decoded.email,
            roleFromJWT: decoded.role,
            roleConverted: getRoleFromString(decoded.role),
            displayName: `${decoded.firstname || decoded.firstName || ''} ${decoded.lastname || decoded.lastName || ''}`.trim(),
            permissions: getRolePermissions(getRoleFromString(decoded.role)),
            profileImage: decoded.profile_img || ''
        };

        console.log('🔍 User permissions from JWT:', userPermissions);

        return {
            user: {
                id: userPermissions.userId,
                email: userPermissions.email,
                firstName: decoded.firstname || decoded.firstName || '',
                lastName: decoded.lastname || decoded.lastName || '',
                role: userPermissions.roleConverted,
                displayName: userPermissions.displayName,
                profileImage: userPermissions.profileImage
            },
            permissions: userPermissions.permissions
        };
    } catch (error: any) {
        console.error('❌ Error getting user permissions:', error);
        throw new Error(error.message || 'ไม่สามารถตรวจสอบสิทธิ์ผู้ใช้ได้');
    }
};

// แปลง role string เป็น UserRole enum
export const getRoleFromString = (roleString: string): UserRole => {
    switch (roleString?.toLowerCase()) {
        case 'super admin':
            return UserRole.LEVEL_5;
        case 'admin':
            return UserRole.LEVEL_4;
        case 'manager':
            return UserRole.LEVEL_3;
        case 'user':
            return UserRole.LEVEL_2;
        case 'viewer':
            return UserRole.LEVEL_1;
        default:
            return UserRole.LEVEL_2; // default to user
    }
};

// แปลง UserRole enum เป็น string
export const roleToString = (role: UserRole): string => {
    switch (role) {
        case UserRole.LEVEL_5:
            return 'super admin';
        case UserRole.LEVEL_4:
            return 'admin';
        case UserRole.LEVEL_3:
            return 'manager';
        case UserRole.LEVEL_2:
            return 'user';
        case UserRole.LEVEL_1:
            return 'viewer';
        default:
            return 'user';
    }
};

// เก็บ token
export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
};

// ดึง token
export const getToken = (): string | null => {
    return localStorage.getItem('token');
};

// ลบ token
export const removeToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('container_cookie');
};

// ออกจากระบบ
export const logoutUser = () => {
    removeToken();
    window.location.href = '/';
};

// ตรวจสอบว่า login หรือยัง
export const isAuthenticated = (): boolean => {
    const token = getToken();
    if (!token) return false;
    
    try {
        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp > currentTime;
    } catch {
        return false;
    }
};

// ปรับ export สำหรับความเข้ากันได้
export const getUsers = fetchAllUsers;

// เปลี่ยนรหัสผ่าน
export const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
            currentPassword,
            newPassword
        }, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            withCredentials: true
        });

        console.log('✅ Password changed successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('❌ Error changing password:', error);
        throw new Error(error.response?.data?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
    }
};

// อัพเดตโปรไฟล์พร้อมรูปภาพ
export const updateProfileWithImage = async (profileData: { firstName: string; lastName: string; }, imageFile?: File) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('ไม่พบ token สำหรับการยืนยันตัวตน');
        }

        // Get current user ID from token
        const { jwtDecode } = require('jwt-decode');
        const decoded: any = jwtDecode(token);
        const userId = decoded.userId || decoded.id;

        console.log('🔍 Update profile - userId:', userId);
        console.log('🔍 Update profile - data:', profileData);

        if (imageFile) {
            // ใช้ FormData สำหรับอัพโหลดรูป
            const formData = new FormData();
            formData.append('userId', userId);
            formData.append('firstName', profileData.firstName);
            formData.append('lastName', profileData.lastName);
            formData.append('role', decoded.role); // เพิ่ม role สำหรับ backend validation
            formData.append('image', imageFile); // backend ต้องการ field name 'image'

            console.log('📤 Sending FormData to backend');

            // ใช้ endpoint ที่มีอยู่ใน backend
            const response = await axios.patch(`${API_BASE_URL}/auth/update`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            return response.data;
        } else {
            // ไม่มีรูป ใช้ updateUser ธรรมดา
            console.log('📤 Updating without image');
            return await updateUser(userId, profileData);
        }
    } catch (error: any) {
        console.error('❌ Error updating profile:', error);
        console.error('❌ Error response:', error.response?.data);
        throw new Error(error.response?.data?.message || 'ไม่สามารถอัพเดตโปรไฟล์ได้');
    }
};
export const getAllUsers = fetchAllUsers;
