import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../../types/User';
import '../../../styles/pages/EditUserModal.css';

interface Props {
    loading: boolean;
    editingUser: User;
    availableRoles: { value: UserRole; label: string }[];
    onUpdate: (id: string, data: { firstName: string; lastName: string; role?: UserRole; isActive?: boolean; }) => void;
    onCancel: () => void;
}

const EditUserForm: React.FC<Props> = ({ loading, editingUser, availableRoles, onUpdate, onCancel }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        role: editingUser.role as UserRole
    });

    useEffect(() => {
        setFormData({
            firstName: editingUser.firstName || '',
            lastName: editingUser.lastName || '',
            email: editingUser.email || '',
            role: editingUser.role as UserRole
        });
    }, [editingUser]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'role' ? parseInt(value) as UserRole : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdate(editingUser.id, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role
        });
    };

    return (
        <div className="EditUser-Modal-overlay">
            <div className="EditUser-Modal-container">
                <h3 className="EditUser-Modal-title">แก้ไขผู้ใช้</h3>
                <form className="EditUser-Modal-form" onSubmit={handleSubmit}>
                    <div className="EditUser-Modal-row">
                        <div className="EditUser-Modal-group">
                            <label>ชื่อจริง:</label>
                            <input
                                className="EditUser-Modal-input"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="EditUser-Modal-group">
                            <label>นามสกุล:</label>
                            <input
                                className="EditUser-Modal-input"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="EditUser-Modal-group">
                        <label>อีเมล:</label>
                        <input
                            className="EditUser-Modal-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                        />
                    </div>

                    <div className="EditUser-Modal-group">
                        <label>บทบาท:</label>
                        <select
                            className="EditUser-Modal-select"
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                        >
                            {availableRoles.map(r => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="EditUser-Modal-actions">
                        <button type="button" className="create-user-modal__btn create-user-modal__btn--secondary" onClick={onCancel}>
                            ยกเลิก
                        </button>
                        <button type="submit" className="create-user-modal__btn create-user-modal__btn--primary" disabled={loading}>
                            {loading ? 'กำลังอัพเดทข้อมูล...' : 'อัปเดตผู้ใช้'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserForm;
