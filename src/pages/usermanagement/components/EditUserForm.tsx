import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../../types/User';
import '../../../styles/pages/UserForm.css';
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
        <div className="user-form-container">
            <div className="user-form">
                <h3>แก้ไขผู้ใช้</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label>ชื่อจริง:</label>
                            <input name="firstName" value={formData.firstName} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>นามสกุล:</label>
                            <input name="lastName" value={formData.lastName} onChange={handleChange} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>อีเมล:</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled />
                    </div>

                    <div className="form-group">
                        <label>บทบาท:</label>
                        <select name="role" value={formData.role} onChange={handleChange} required>
                            {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    <div className="form-actions">
                        
                        <button type="button" className="btn-secondary" onClick={onCancel}>ยกเลิก</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'กำลังอัพเดทข้อมูล...' : 'อัปเดตผู้ใช้'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserForm;