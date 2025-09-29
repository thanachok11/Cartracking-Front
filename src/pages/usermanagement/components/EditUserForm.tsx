import React, { useState, useEffect } from 'react';
import { useI18n } from '../../../i18n';
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
    const { t } = useI18n();
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
                <h3 className="EditUser-Modal-title">{t('userManagement.actions.edit')}</h3>
                <form className="EditUser-Modal-form" onSubmit={handleSubmit}>
                    <div className="EditUser-Modal-row">
                        <div className="EditUser-Modal-group">
                            <label>{t('userinfo.labels.firstName')}:</label>
                            <input
                                className="EditUser-Modal-input"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="EditUser-Modal-group">
                            <label>{t('userinfo.labels.lastName')}:</label>
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
                        <label>{t('userinfo.labels.email')}:</label>
                        <input
                            className="EditUser-Modal-email"
                            type="email"
                            name="email"
                            value={formData.email}
                            disabled
                        />
                    </div>

                    <div className="EditUser-Modal-group">
                        <label>{t('userManagement.table.role')}:</label>
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
                            {t('userinfo.buttons.cancel')}
                        </button>
                        <button type="submit" className="create-user-modal__btn create-user-modal__btn--primary" disabled={loading}>
                            {loading ? t('common.loading') : t('userinfo.buttons.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditUserForm;
