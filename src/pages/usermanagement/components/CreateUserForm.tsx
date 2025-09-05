import React, { useState } from 'react';
import { UserRole } from '../../../types/User';

interface Props {
    loading: boolean;
    availableRoles: { value: UserRole; label: string }[];
    onCreate: (data: {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        role: UserRole;
    }) => void;
    onCancel: () => void;
}

const CreateUserForm: React.FC<Props> = ({ loading, availableRoles, onCreate, onCancel }) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: UserRole.LEVEL_2
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'role' ? parseInt(value) as UserRole : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(formData);
    };

    return (
        <div className="user-form-container">
            <div className="user-form">
                <h3>เพิ่มผู้ใช้ใหม่</h3>
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
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </div>

                    <div className="form-group">
                        <label>รหัสผ่าน:</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength={6} />
                    </div>

                    <div className="form-group">
                        <label>บทบาท:</label>
                        <select name="role" value={formData.role} onChange={handleChange} required>
                            {availableRoles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                        <small className="role-hint">คุณสามารถมอบหมายบทบาทได้เฉพาะระดับที่เท่ากับหรือต่ำกว่าระดับของคุณเท่านั้น</small>
                    </div>

                    <div className="form-actions">
                   
                        <button type="button" className="btn-secondary" onClick={onCancel}>ยกเลิก</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'กำลังเพิ่มผู้ใช้...' : 'เพิ่มผู้ใช้'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserForm;