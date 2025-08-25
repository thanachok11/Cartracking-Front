// usersApi.ts - User management API functions
// เปลี่ยนมาใช้ฟังก์ชันจาก auth.ts แทนเพื่อให้สอดคล้องกับ backend

import { 
    fetchAllUsers as authFetchAllUsers, 
    createUser as authCreateUser,
    updateUser as authUpdateUser,
    deleteUser as authDeleteUser,
    updateUserRole as authUpdateUserRole,
    getUserPermissions,
    changePassword as authChangePassword,
    updateProfileWithImage as authUpdateProfileWithImage,
    updateStatus as authUpdateStatus
} from '../auth/auth';
import { UserRole } from '../../types/User';

// Export ฟังก์ชันจาก auth.ts เพื่อให้ SettingsPage ใช้ได้
export const getAllUsers = authFetchAllUsers;
export const createUser = authCreateUser;
export const updateUser = authUpdateUser;
export const deleteUser = authDeleteUser;
export const updateUserRole = authUpdateUserRole;
export const changePassword = authChangePassword;
export const updateProfileWithImage = authUpdateProfileWithImage;
export const updateStatus = authUpdateStatus;
// ฟังก์ชันดึงข้อมูลผู้ใช้ปัจจุบัน
export const getCurrentUserInfo = async () => {
    try {
        const userPermissions = await getUserPermissions();
        if (!userPermissions) {
            throw new Error('ไม่สามารถดึงข้อมูลผู้ใช้ได้');
        }
        
        return userPermissions;
    } catch (error: any) {
        console.error('❌ Error getting current user info:', error);
        throw new Error(error.message || 'ไม่สามารถดึงข้อมูลผู้ใช้ปัจจุบันได้');
    }
};

// Helper function สำหรับแปลง UserRole enum เป็น string สำหรับ backend
// Backend รองรับ: 'super admin', 'admin', 'manager', 'viewer', 'user'
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

// Helper function สำหรับแปลง string เป็น UserRole enum
export const stringToRole = (roleString: string): UserRole => {
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
            return UserRole.LEVEL_2;
    }
};
