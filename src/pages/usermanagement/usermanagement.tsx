import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/User';
import { 
    getAllUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    updateUserRole,
    getCurrentUserInfo,
    roleToString
} from '../../api/components/usersApi';
import '../../styles/pages/SettingsPage.css';

interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
}

// Helper function to get role display name
const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
        case UserRole.LEVEL_5: return 'Super Admin';
        case UserRole.LEVEL_4: return 'Admin';
        case UserRole.LEVEL_3: return 'Manager';
        case UserRole.LEVEL_2: return 'User';
        case UserRole.LEVEL_1: return 'Viewer';
        default: return 'User';
    }
};

// Helper function to check if current user can assign a specific role
const canAssignRole = (currentUserRole: UserRole, targetRole: UserRole): boolean => {
    // Super Admin can assign any role
    if (currentUserRole === UserRole.LEVEL_5) return true;
    
    // Admin can assign roles up to Admin level (but not Super Admin)
    if (currentUserRole === UserRole.LEVEL_4) {
        return targetRole <= UserRole.LEVEL_4;
    }
    
    // Manager can assign roles up to Manager level
    if (currentUserRole === UserRole.LEVEL_3) {
        return targetRole <= UserRole.LEVEL_3;
    }
    
    return false;
};

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<any>(null);

    // Form states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: UserRole.LEVEL_2
    });

    // Load current user and all users
    useEffect(() => {
        loadData();
    }, []);

    // Auto clear messages after 5 seconds
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(''), 8000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Get current user info
            const userInfo = await getCurrentUserInfo();
            console.log('🔍 Current user info in Settings:', userInfo);
            setCurrentUser(userInfo);
            
            // Check if user has permission to manage users
            if (userInfo?.permissions?.canManageUsers) {
                console.log('✅ User has permission to manage users');
                // Get all users
                const usersData = await getAllUsers();
                console.log('🔍 Loaded users:', usersData);
                setUsers(usersData.users);
            } else {
                console.log('❌ User does not have permission to manage users');
            }
            
            setError('');
        } catch (err: any) {
            console.error('❌ Error loading data:', err);
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'role' ? parseInt(value) as UserRole : value
        }));
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError('');
            
            // Check if current user can assign the selected role
            const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
            if (!canAssignRole(currentRole, formData.role)) {
                setError('You do not have permission to assign this role');
                return;
            }
            
            const userData = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: roleToString(formData.role) // Convert enum to string for backend
            };
            
            console.log('🔍 Creating user with data:', userData);
            
            await createUser(userData);
            setSuccess('สร้างผู้ใช้สำเร็จ!');
            
            // Reset form and close
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: UserRole.LEVEL_2
            });
            setShowCreateForm(false);
            
            // Reload users
            await loadData();
            
        } catch (err: any) {
            console.error('❌ ข้อผิดพลาดในการสร้างผู้ใช้:', err);
            setError(err.message || 'ไม่สามารถสร้างผู้ใช้ได้');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!editingUser) return;
        
        try {
            setLoading(true);
            setError('');
            
            // Check if current user can assign the selected role
            const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
            if (formData.role !== editingUser.role && !canAssignRole(currentRole, formData.role)) {
                setError('คุณไม่มีสิทธิ์มอบหมายบทบาทนี้');
                return;
            }
            
            // อัพเดตข้อมูลผู้ใช้ทั่วไป
            await updateUser(editingUser.id, {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email
            });
            
            // อัพเดต role หากมีการเปลี่ยนแปลง
            if (formData.role !== editingUser.role) {
                const newRoleString = roleToString(formData.role);
                await updateUserRole(editingUser.id, newRoleString);
            }
            
            setSuccess('อัปเดตผู้ใช้สำเร็จ!');
            setEditingUser(null);
            
            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                role: UserRole.LEVEL_2
            });
            
            // Reload users
            await loadData();
            
        } catch (err: any) {
            console.error('❌ ข้อผิดพลาดในการอัปเดตผู้ใช้:', err);
            setError(err.message || 'ไม่สามารถอัปเดตผู้ใช้ได้');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?')) {
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            await deleteUser(userId);
            setSuccess('ลบผู้ใช้สำเร็จ!');

            // Reload users
            await loadData();
            
        } catch (err: any) {
            setError(err.message || 'ไม่สามารถลบผู้ใช้ได้');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            setLoading(true);
            setError('');
            
            // Check if current user can assign the selected role
            const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
            if (!canAssignRole(currentRole, newRole)) {
                setError('คุณไม่มีสิทธิ์ในการมอบหมายบทบาทนี้');
                return;
            }
            
            const newRoleString = roleToString(newRole);
            console.log('🔍 กำลังเปลี่ยนบทบาทของผู้ใช้:', userId, 'เป็น:', newRoleString);
            
            await updateUserRole(userId, newRoleString);
            setSuccess('อัปเดตบทบาทผู้ใช้สำเร็จ!');

            // Reload users
            await loadData();
            
        } catch (err: any) {
            console.error('❌ ข้อผิดพลาดในการเปลี่ยนบทบาท:', err);
            setError(err.message || 'ไม่สามารถอัปเดตบทบาทผู้ใช้ได้');
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            password: '',
            role: user.role
        });
        setShowCreateForm(false);
    };

    const cancelEdit = () => {
        setEditingUser(null);
        setFormData({
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            role: UserRole.LEVEL_2
        });
    };

    // Get available roles for current user
    const getAvailableRoles = () => {
        const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
        const roles = [];
        
        roles.push({ value: UserRole.LEVEL_1, label: 'ผู้ชม' });
        roles.push({ value: UserRole.LEVEL_2, label: 'ผู้ใช้' });
        
        if (currentRole >= UserRole.LEVEL_3) {
            roles.push({ value: UserRole.LEVEL_3, label: 'ผู้จัดการ' });
        }
        
        if (currentRole >= UserRole.LEVEL_4) {
            roles.push({ value: UserRole.LEVEL_4, label: 'ผู้ดูแลระบบ' });
        }
        
        // if (currentRole >= UserRole.LEVEL_5) {
        //     roles.push({ value: UserRole.LEVEL_5, label: 'ผู้ดูแลระบบสูงสุด' });
        // }
        
        return roles;
    };

    const getCreateRoles = () => {
        const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
        const roles = [];
        
        roles.push({ value: UserRole.LEVEL_1, label: 'ผู้ชม' });
        roles.push({ value: UserRole.LEVEL_2, label: 'ผู้ใช้' });
        
        if (currentRole >= UserRole.LEVEL_3) {
            roles.push({ value: UserRole.LEVEL_3, label: 'ผู้จัดการ' });
        }
        
        if (currentRole >= UserRole.LEVEL_4) {
            roles.push({ value: UserRole.LEVEL_4, label: 'ผู้ดูแลระบบ' });
        }
        
        return roles;
    };

    // Check permissions
    if (!currentUser?.permissions?.canManageUsers) {
        return (
            <div className="settings-page">
                <div className="access-denied">
                    <h2>ไม่มีสิทธิ์เข้าถึง</h2>
                    <p>คุณไม่มีสิทธิ์เข้าถึงการจัดการผู้ใช้</p>
                    {currentUser && (
                        <p>บทบาทปัจจุบันของคุณ: <strong>{getRoleDisplayName(currentUser.user?.role || UserRole.LEVEL_2)}</strong></p>
                    )}
                    <p>เฉพาะผู้จัดการ, ผู้ดูแลระบบ และผู้ดูแลระบบสูงสุดเท่านั้นที่สามารถจัดการผู้ใช้ได้</p>
                </div>
            </div>
        );
    }

    if (loading && !users.length) {
        return (
            <div className="settings-page">
                <div className="loading">กำลังโหลดข้อมูล...</div>
            </div>
        );
    }

    const availableRoles = getAvailableRoles();
    const forCreateRoles = getCreateRoles();

    return (
        <div className="settings-page">
            <div className="settings-header">
                <div>
                    <h1>การจัดการผู้ใช้</h1>
                    {currentUser && (
                        <p className="current-user-info">
                            ลงชื่อเข้าใช้ในชื่อ: <strong>{currentUser.user?.firstName} {currentUser.user?.lastName}</strong> 
                            ({getRoleDisplayName(currentUser.user?.role || UserRole.LEVEL_2)})
                        </p>
                    )}
                </div>
                <button 
                    className="create-user-btn"
                    onClick={() => {
                        setShowCreateForm(true);
                        setEditingUser(null);
                        setFormData({
                            firstName: '',
                            lastName: '',
                            email: '',
                            password: '',
                            role: UserRole.LEVEL_2
                        });
                    }}
                >
                    สร้างผู้ใช้ใหม่
                </button>
                <button
                    className="refresh-user-btn"
                    onClick={() => {
                        // Refresh the user list
                        loadData();
                    }}
                >
                    รีเฟรช
                </button>
            </div>

            {/* Alert messages */}
            {error && (
                <div className="alert alert-error">
                    {error}
                    <button onClick={() => setError('')} className="alert-close">×</button>
                </div>
            )}
            
            {success && (
                <div className="alert alert-success">
                    {success}
                    <button onClick={() => setSuccess('')} className="alert-close">×</button>
                </div>
            )}

            {/* User Form */}
            {(showCreateForm || editingUser) && (
                <div className="user-form-container">
                    <div className="user-form">
                        <h3>{editingUser ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้ใหม่'}</h3>
                        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>ชื่อจริง:</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>นามสกุล:</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label>อีเมล:</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            
                            {!editingUser && (
                                <div className="form-group">
                                    <label>รหัสผ่าน:</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                        minLength={6}
                                    />
                                </div>
                            )}
                            
                            <div className="form-group">
                                <label>บทบาท:</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    {forCreateRoles.map(role => (
                                        <option key={role.value} value={role.value}>
                                            {role.label}
                                        </option>
                                    ))}
                                </select>
                                <small className="role-hint">
                                    คุณสามารถมอบหมายบทบาทได้เฉพาะระดับที่เท่ากับหรือต่ำกว่าระดับของคุณเท่านั้น
                                </small>
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Processing...' : (editingUser ? 'อัปเดตผู้ใช้' : 'เพิ่มผู้ใช้')}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        cancelEdit();
                                    }}
                                >
                                    ยกเลิก
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Users Table */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>ชื่อ</th>
                            <th>อีเมล</th>
                            <th>บทบาท</th>
                            <th>วันที่สร้าง</th>
                            <th>สถานะ</th>
                            <th>การจัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => {
                            const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
                            const canEditThisUser = canAssignRole(currentRole, user.role);
                            
                            return (
                                <tr key={user.id}>
                                    <td>
                                        <div className="user-info">
                                            <div className="user-avatar">
                                                {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                                {user.lastName?.charAt(0) || ''}
                                            </div>
                                            <span>{`${user.firstName} ${user.lastName}`.trim() || user.email}</span>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value) as UserRole)}
                                            className="role-select"
                                            disabled={loading || !canEditThisUser}
                                            title={canEditThisUser ? `Current role: ${getRoleDisplayName(user.role)}` : 'You cannot modify this user\'s role'}
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                        {!canEditThisUser && (
                                            <small className="permission-note">ไม่สามารถแก้ไขได้</small>
                                        )}
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                                            {user.isActive ? 'เปิดใช้งาน' : 'ปดการใช้งาน'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                className="btn-edit"
                                                onClick={() => startEdit(user)}
                                                disabled={loading || !canEditThisUser}
                                                title={canEditThisUser ? 'แก้ไขผู้ใช้' : 'คุณไม่สามารถแก้ไขผู้ใช้นี้ได้'}
                                            >
                                                แก้ไข
                                            </button>
                                            <button
                                                className="btn-delete"
                                                onClick={() => handleDeleteUser(user.id)}
                                                disabled={loading || !canEditThisUser}
                                                title={canEditThisUser ? 'ลบผู้ใช้' : 'คุณไม่สามารถลบผู้ใช้นี้ได้'}
                                            >
                                                ลบ
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                
                {users.length === 0 && !loading && (
                    <div className="no-users">
                        <p>ไม่พบผู้ใช้</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
