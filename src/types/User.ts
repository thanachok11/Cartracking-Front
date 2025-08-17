// User types and enums for the application

export enum UserRole {
    LEVEL_1 = 1, // viewer
    LEVEL_2 = 2, // user
    LEVEL_3 = 3, // manager
    LEVEL_4 = 4  // admin
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    createdAt: string;
    lastLogin: string;
    isActive: boolean;
    profile_img?: string;
}

export interface UserPermissions {
    canViewAll: boolean;
    canEdit: boolean;
    canManageUsers: boolean;
    canAccessSettings: boolean;
}

// Helper function to get role name from UserRole enum
export const getRoleName = (role: UserRole): string => {
    switch (role) {
        case UserRole.LEVEL_4:
            return 'Admin';
        case UserRole.LEVEL_3:
            return 'Manager';
        case UserRole.LEVEL_2:
            return 'User';
        case UserRole.LEVEL_1:
            return 'Viewer';
        default:
            return 'User';
    }
};

// Helper function to get permissions based on role
export const getRolePermissions = (role: UserRole): UserPermissions => {
    switch (role) {
        case UserRole.LEVEL_4: // Admin
            return {
                canViewAll: true,
                canEdit: true,
                canManageUsers: true,
                canAccessSettings: true
            };
        case UserRole.LEVEL_3: // Manager
            return {
                canViewAll: true,
                canEdit: true,
                canManageUsers: true,
                canAccessSettings: true
            };
        case UserRole.LEVEL_2: // User
            return {
                canViewAll: true,
                canEdit: true,
                canManageUsers: false,
                canAccessSettings: false
            };
        case UserRole.LEVEL_1: // Viewer
            return {
                canViewAll: true,
                canEdit: false,
                canManageUsers: false,
                canAccessSettings: false
            };
        default:
            return {
                canViewAll: false,
                canEdit: false,
                canManageUsers: false,
                canAccessSettings: false
            };
    }
};

// Helper function to convert backend string role to UserRole enum
export const stringToRole = (roleString: string): UserRole => {
    switch (roleString?.toLowerCase()) {
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

// Helper function to convert UserRole enum to backend string
export const roleToString = (role: UserRole): string => {
    switch (role) {
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

// Helper function to create User object from backend database response
export const userFromDatabase = (dbUser: any): User => {
    return {
        id: dbUser._id || dbUser.id,
        firstName: dbUser.firstName || '',
        lastName: dbUser.lastName || '',
        email: dbUser.email,
        role: stringToRole(dbUser.role),
        createdAt: dbUser.createdAt || new Date().toISOString(),
        lastLogin: dbUser.lastLogin || dbUser.updatedAt || new Date().toISOString(),
        isActive: dbUser.isActive !== false,
        profile_img: dbUser.profile_img || 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg'
    };
};
