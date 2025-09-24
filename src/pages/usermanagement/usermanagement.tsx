import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/User';
import { useNavigate } from "react-router-dom";

import {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserRole,
    getCurrentUserInfo,
    roleToString,
    updateStatus
} from '../../api/components/usersApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faSync,
    faUserShield
} from '@fortawesome/free-solid-svg-icons';
import '../../styles/pages/SettingsPage.css';
import EditUserForm from './components/EditUserForm';
import CreateUserModal from './components/CreateUserForm';
interface UserFormData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole;
    isActive?: boolean;
}

// Helper function to get role display name
const getRoleDisplayName = (role: UserRole): string => {
    switch (role) {
        case UserRole.LEVEL_5: return 'Super Admin';
        case UserRole.LEVEL_4: return 'Admin';
        case UserRole.LEVEL_3: return 'Manager';
        case UserRole.LEVEL_2: return 'User';
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
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    // Form states
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: UserRole.LEVEL_2,

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

    // Filter users based on search term
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredUsers(users);
        } else {
            const filtered = users.filter(user => {
                const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
                const email = (user.email || '').toLowerCase();
                const search = searchTerm.toLowerCase();
                
                return fullName.includes(search) || email.includes(search);
            });
            setFilteredUsers(filtered);
        }
    }, [users, searchTerm]);

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
            role: user.role,
            isActive: user.isActive
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

        roles.push({ value: UserRole.LEVEL_2, label: 'ผู้ใช้' });

        if (currentRole >= UserRole.LEVEL_3) {
            roles.push({ value: UserRole.LEVEL_3, label: 'ผู้จัดการ' });
        }

        if (currentRole >= UserRole.LEVEL_4) {
            roles.push({ value: UserRole.LEVEL_4, label: 'ผู้ดูแลระบบ' });
        }


        return roles;
    };
    const handleStatusChange = async (id: string, newStatus: number) => {
        try {
            setLoading(true);

            // ส่งไปอัพเดทสถานะผู้ใช้โดยใช้ฟังก์ชัน updateStatus
            await updateStatus(id, newStatus === 1);

            setSuccess(newStatus === 1 ? 'เปิดใช้งานผู้ใช้แล้ว' : 'ปิดการใช้งานผู้ใช้แล้ว');

            // โหลดข้อมูลใหม่เพื่อรีเฟรช table
            await loadData();
        } catch (err: any) {
            setError(err.message || 'ไม่สามารถอัปเดตสถานะได้');
        } finally {
            setLoading(false);
        }
    };


    const getCreateRoles = () => {
        const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
        const roles = [];

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
                    <p className="result-count">
                        {searchTerm ? 
                            `พบ ${filteredUsers.length} จาก ${users.length} ผู้ใช้` : 
                            `ทั้งหมด ${users.length} ผู้ใช้`
                        }
                    </p>
                    {currentUser && (
                        <p className="current-user-info">
                            ลงชื่อเข้าใช้ในชื่อ: <strong>{currentUser.user?.firstName} {currentUser.user?.lastName}</strong>
                            ({getRoleDisplayName(currentUser.user?.role || UserRole.LEVEL_2)})
                        </p>
                    )}
                </div>

                <div className="settings-header-actions">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="ค้นหาด้วยชื่อหรืออีเมล..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <button
                        className="refresh-btn"
                        onClick={() => {
                            // Refresh the user list
                            loadData();
                        }}
                    >
                        <FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''} />
                        รีเฟรช
                    </button>

                    <button
                        className="add-btn"
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
                        <FontAwesomeIcon icon={faPlus} />
                        สร้างผู้ใช้ใหม่
                    </button>

                    <button
                        className="permission-btn"
                        onClick={() => navigate("/allowed-pages-manager")}
                    >
                        <FontAwesomeIcon icon={faUserShield} />
                        จัดการสิทธิ์เข้าใช้งานหน้า
                    </button>
                </div>

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
            {showCreateForm && (
                <CreateUserModal
                    isOpen={showCreateForm}
                    loading={loading}
                    availableRoles={forCreateRoles}
                    onCreate={async (data) => {
                        try {
                            setLoading(true);
                            await createUser({
                                email: data.email,
                                password: data.password,
                                firstName: data.firstName,
                                lastName: data.lastName,
                                role: roleToString(data.role)
                            });
                            setSuccess('สร้างผู้ใช้สำเร็จ!');
                            setShowCreateForm(false);
                            await loadData();
                        } catch (err: any) {
                            setError(err.message || 'ไม่สามารถสร้างผู้ใช้ได้');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    onCancel={() => setShowCreateForm(false)}
                />

            )}

            {editingUser && (
                <EditUserForm
                    loading={loading}
                    editingUser={editingUser}
                    availableRoles={availableRoles}
                    onUpdate={async (id, data) => {
                        try {
                            setLoading(true);
                            await updateUser(id, {
                                firstName: data.firstName,
                                lastName: data.lastName,
                            });
                            if (data.role !== undefined && data.role !== editingUser.role) {
                                await updateUserRole(id, roleToString(data.role as UserRole));
                            }
                            setSuccess('อัปเดตผู้ใช้สำเร็จ!');
                            setEditingUser(null);
                            await loadData();
                        } catch (err: any) {
                            setError(err.message || 'ไม่สามารถอัปเดตผู้ใช้ได้');
                        } finally {
                            setLoading(false);
                        }
                    }}
                    onCancel={() => {
                        cancelEdit();
                    }}
                />
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
                        {filteredUsers.map(user => {
                            const currentRole = currentUser?.user?.role;
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
                                        <label className="switch">
                                            <input
                                                type="checkbox"
                                                checked={user.isActive}
                                                disabled={loading || !canEditThisUser}
                                                onChange={(e) => handleStatusChange(user.id, e.target.checked ? 1 : 0)}
                                            />
                                            <span className="slider"></span>
                                        </label>
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

                {filteredUsers.length === 0 && !loading && (
                    <div className="no-users">
                        <p>{searchTerm ? 'ไม่พบผู้ใช้ที่ตรงกับการค้นหา' : 'ไม่พบผู้ใช้'}</p>
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="clear-search-btn"
                            >
                                ล้างการค้นหา
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
