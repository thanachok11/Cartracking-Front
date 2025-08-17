import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types/User';
import { 
    getAllUsers, 
    createUser, 
    updateUser, 
    deleteUser, 
    updateUserRole,
    getCurrentUserInfo,
    roleToString
} from '../api/components/usersApi';
import '../styles/pages/SettingsPage.css';

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
        case UserRole.LEVEL_4: return 'Admin';
        case UserRole.LEVEL_3: return 'Manager';
        case UserRole.LEVEL_2: return 'User';
        case UserRole.LEVEL_1: return 'Viewer';
        default: return 'User';
    }
};

const SettingsPage: React.FC = () => {
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
            
            const userData = {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                role: roleToString(formData.role) // Convert enum to string for backend
            };
            
            console.log('🔍 Creating user with data:', userData);
            
            await createUser(userData);
            setSuccess('User created successfully!');
            
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
            console.error('❌ Create user error:', err);
            setError(err.message || 'Failed to create user');
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
            
            setSuccess('User updated successfully!');
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
            console.error('❌ Update user error:', err);
            setError(err.message || 'Failed to update user');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!window.confirm('Are you sure you want to delete this user?')) {
            return;
        }
        
        try {
            setLoading(true);
            setError('');
            
            await deleteUser(userId);
            setSuccess('User deleted successfully!');
            
            // Reload users
            await loadData();
            
        } catch (err: any) {
            setError(err.message || 'Failed to delete user');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        try {
            setLoading(true);
            setError('');
            
            const newRoleString = roleToString(newRole);
            console.log('🔍 Changing role for user:', userId, 'to:', newRoleString);
            
            await updateUserRole(userId, newRoleString);
            setSuccess('User role updated successfully!');
            
            // Reload users
            await loadData();
            
        } catch (err: any) {
            console.error('❌ Role change error:', err);
            setError(err.message || 'Failed to update user role');
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

    // Check permissions
    if (!currentUser?.permissions?.canManageUsers) {
        return (
            <div className="settings-page">
                <div className="access-denied">
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access user management.</p>
                    {currentUser && (
                        <p>Your current role: <strong>{getRoleDisplayName(currentUser.user?.role || UserRole.LEVEL_2)}</strong></p>
                    )}
                    <p>Only Admin and Manager roles can manage users.</p>
                </div>
            </div>
        );
    }

    if (loading && !users.length) {
        return (
            <div className="settings-page">
                <div className="loading">Loading...</div>
            </div>
        );
    }

    return (
        <div className="settings-page">
            <div className="settings-header">
                <div>
                    <h1>User Management</h1>
                    {currentUser && (
                        <p className="current-user-info">
                            Logged in as: <strong>{currentUser.user?.firstName} {currentUser.user?.lastName}</strong> 
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
                    Create New User
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
                        <h3>{editingUser ? 'Edit User' : 'Create New User'}</h3>
                        <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>First Name:</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Last Name:</label>
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
                                <label>Email:</label>
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
                                    <label>Password:</label>
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
                                <label>Role:</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value={UserRole.LEVEL_1}>Viewer</option>
                                    <option value={UserRole.LEVEL_2}>User</option>
                                    <option value={UserRole.LEVEL_3}>Manager</option>
                                    <option value={UserRole.LEVEL_4}>Admin</option>
                                </select>
                            </div>
                            
                            <div className="form-actions">
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? 'Processing...' : (editingUser ? 'Update User' : 'Create User')}
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-secondary"
                                    onClick={() => {
                                        setShowCreateForm(false);
                                        cancelEdit();
                                    }}
                                >
                                    Cancel
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
                            <th>Name</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Created</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
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
                                        disabled={loading}
                                        title={`Current role: ${getRoleDisplayName(user.role)}`}
                                    >
                                        <option value={UserRole.LEVEL_1}>Viewer</option>
                                        <option value={UserRole.LEVEL_2}>User</option>
                                        <option value={UserRole.LEVEL_3}>Manager</option>
                                        <option value={UserRole.LEVEL_4}>Admin</option>
                                    </select>
                                </td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn-edit"
                                            onClick={() => startEdit(user)}
                                            disabled={loading}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDeleteUser(user.id)}
                                            disabled={loading}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                {users.length === 0 && !loading && (
                    <div className="no-users">
                        <p>No users found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsPage;
