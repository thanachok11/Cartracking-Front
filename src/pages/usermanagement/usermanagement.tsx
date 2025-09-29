import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/User';
import { useNavigate } from "react-router-dom";
import { useI18n } from '../../i18n';

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
const getRoleDisplayName = (role: UserRole, t: any): string => {
    switch (role) {
        case UserRole.LEVEL_5: return t('roles.superAdmin');
        case UserRole.LEVEL_4: return t('roles.admin');
        case UserRole.LEVEL_3: return t('roles.manager');
        case UserRole.LEVEL_2: return t('roles.user');
        default: return t('roles.user');
    }
};

// Helper function to check if current user can assign a specific role
const canAssignRole = (currentUserRole: UserRole, targetRole: UserRole): boolean => {
    if (currentUserRole === UserRole.LEVEL_5) return true;
    if (currentUserRole === UserRole.LEVEL_4) {
        return targetRole <= UserRole.LEVEL_4;
    }
    if (currentUserRole === UserRole.LEVEL_3) {
        return targetRole <= UserRole.LEVEL_3;
    }
    return false;
};

// ฟังก์ชันช่วย format เวลา lastActive → "5 นาทีที่แล้ว"
const timeAgo = (dateString?: string, t?: any): string => {
    if (!dateString) return "-";
    if (!t) return "-";
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return t('userManagement.time.justNow');
    if (diffMin < 60) return t('userManagement.time.minutesAgo', { minutes: diffMin });
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return t('userManagement.time.hoursAgo', { hours: diffHr });
    const diffDay = Math.floor(diffHr / 24);
    return t('userManagement.time.daysAgo', { days: diffDay });
};

const UserManagement: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useI18n();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
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

    // Auto clear messages
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

    // Filter users
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
            const userInfo = await getCurrentUserInfo();
            setCurrentUser(userInfo);

            if (userInfo?.permissions?.canManageUsers) {
                const usersData = await getAllUsers();
                setUsers(usersData.users);
            }
            setError('');
        } catch (err: any) {
            setError(err.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm(t('userManagement.messages.deleteConfirm'))) return;
        try {
            setLoading(true);
            setError('');
            await deleteUser(userId);
            setSuccess(t('userManagement.messages.deleteSuccess'));
            await loadData();
        } catch (err: any) {
            setError(err.message || t('userManagement.messages.deleteFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            setLoading(true);
            setError('');
            const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
            if (!canAssignRole(currentRole, newRole)) {
                setError(t('userManagement.messages.noPermission'));
                return;
            }
            const newRoleString = roleToString(newRole);
            await updateUserRole(userId, newRoleString);
            setSuccess(t('userManagement.messages.roleUpdateSuccess'));
            await loadData();
        } catch (err: any) {
            setError(err.message || t('userManagement.messages.roleUpdateFailed'));
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

    const getAvailableRoles = () => {
        const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
        const roles = [{ value: UserRole.LEVEL_2, label: t('roles.user') }];
        if (currentRole >= UserRole.LEVEL_3) roles.push({ value: UserRole.LEVEL_3, label: t('roles.manager') });
        if (currentRole >= UserRole.LEVEL_4) roles.push({ value: UserRole.LEVEL_4, label: t('roles.admin') });
        return roles;
    };

    const handleStatusChange = async (id: string, newStatus: number) => {
        try {
            setLoading(true);
            await updateStatus(id, newStatus === 1);
            setSuccess(newStatus === 1 ? t('userManagement.messages.statusUpdateSuccess') : t('userManagement.messages.statusDeactivateSuccess'));
            await loadData();
        } catch (err: any) {
            setError(err.message || t('userManagement.messages.statusUpdateFailed'));
        } finally {
            setLoading(false);
        }
    };

    const getCreateRoles = () => {
        const currentRole = currentUser?.user?.role || UserRole.LEVEL_2;
        const roles = [{ value: UserRole.LEVEL_2, label: t('roles.user') }];
        if (currentRole >= UserRole.LEVEL_3) roles.push({ value: UserRole.LEVEL_3, label: t('roles.manager') });
        if (currentRole >= UserRole.LEVEL_4) roles.push({ value: UserRole.LEVEL_4, label: t('roles.admin') });
        return roles;
    };

    if (!currentUser?.permissions?.canManageUsers) {
        return (
            <div className="settings-page">
                <div className="access-denied">
                    <h2>{t('userManagement.messages.accessDenied')}</h2>
                    <p>{t('userManagement.messages.accessDeniedDesc')}</p>
                    {currentUser && (
                        <p>{t('userManagement.messages.currentRole', { role: getRoleDisplayName(currentUser.user?.role || UserRole.LEVEL_2, t) })}</p>
                    )}
                </div>
            </div>
        );
    }

    if (loading && !users.length) {
        return (
            <div className="settings-page">
                <div className="loading">{t('userManagement.messages.loadingData')}</div>
            </div>
        );
    }

    const availableRoles = getAvailableRoles();
    const forCreateRoles = getCreateRoles();

    return (
        <div className="settings-page">
            <div className="settings-header">
                <div>
                    <h1>{t('userManagement.title')}</h1>
                    <p className="result-count">
                        {searchTerm ?
                            t('userManagement.foundUsers', { found: filteredUsers.length, total: users.length }) :
                            t('userManagement.totalUsers', { count: users.length })
                        }
                    </p>
                </div>

                <div className="settings-header-actions">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder={t('userManagement.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <button className="refresh-btn" onClick={loadData}>
                        <FontAwesomeIcon icon={faSync} className={loading ? 'fa-spin' : ''} />
                        {t('userManagement.refresh')}
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
                        {t('userManagement.createUser')}
                    </button>

                    <button className="permission-btn" onClick={() => navigate("/allowed-pages-manager")}>
                        <FontAwesomeIcon icon={faUserShield} />
                        {t('userManagement.managePermissions')}
                    </button>
                </div>
            </div>

            {/* Counter ออนไลน์/ออฟไลน์ */}
            <div className="user-stats">
                <p>{t('userManagement.stats.online', { count: users.filter(u => u.isOnline).length })}</p>
                <p>{t('userManagement.stats.offline', { count: users.filter(u => !u.isOnline).length })}</p>
            </div>

            {/* Alert messages */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

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
                            setSuccess(t('userManagement.messages.createSuccess'));
                            setShowCreateForm(false);
                            await loadData();
                        } catch (err: any) {
                            setError(err.message || t('userManagement.messages.createFailed'));
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
                            await updateUser(id, { firstName: data.firstName, lastName: data.lastName });
                            if (data.role !== undefined && data.role !== editingUser.role) {
                                await updateUserRole(id, roleToString(data.role as UserRole));
                            }
                            setSuccess(t('userManagement.messages.updateSuccess'));
                            setEditingUser(null);
                            await loadData();
                        } catch (err: any) {
                            setError(err.message || t('userManagement.messages.updateFailed'));
                        } finally {
                            setLoading(false);
                        }
                    }}
                    onCancel={cancelEdit}
                />
            )}

            {/* Users Table */}
            <div className="users-table-container">
                <table className="users-table">
                    <thead>
                        <tr>
                            <th>{t('userManagement.table.name')}</th>
                            <th>{t('userManagement.table.email')}</th>
                            <th>{t('userManagement.table.role')}</th>
                            <th>{t('userManagement.table.createdDate')}</th>
                            <th>{t('userManagement.table.online')}</th>
                            <th>{t('userManagement.table.status')}</th>
                            <th>{t('userManagement.table.actions')}</th>
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
                                        >
                                            {availableRoles.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        {user.isOnline ? (
                                            <span className="status-online">🟢 {t('userManagement.table.online')}</span>
                                        ) : (
                                            <span className="status-offline">
                                                🔴 {t('userManagement.stats.offline').replace('🔴 ', '').replace('', '')} <small>({timeAgo(user.lastActive, t)})</small>
                                            </span>
                                        )}
                                    </td>
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
                                            <button className="btn-edit" onClick={() => startEdit(user)} disabled={loading || !canEditThisUser}>
                                                {t('userManagement.actions.edit')}
                                            </button>
                                            <button className="btn-delete" onClick={() => handleDeleteUser(user.id)} disabled={loading || !canEditThisUser}>
                                                {t('userManagement.actions.delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default UserManagement;
