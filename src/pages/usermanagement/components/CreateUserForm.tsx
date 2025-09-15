import React, { useState } from "react";
import { UserRole } from "../../../types/User";
import '../../../styles/pages/CreateUserModal.css';
interface Props {
    isOpen: boolean;
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

const CreateUserModal: React.FC<Props> = ({
    isOpen,
    loading,
    availableRoles,
    onCreate,
    onCancel,
}) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: UserRole.LEVEL_2,
    });

    if (!isOpen) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: name === "role" ? (parseInt(value) as UserRole) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreate(formData);
    };

    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div
                className="create-user-modal__container"
                onClick={(e) => e.stopPropagation()}
            >
                
                <h3 className="create-user-modal__title">เพิ่มผู้ใช้ใหม่</h3>
                <form onSubmit={handleSubmit} className="create-user-modal__form">
                    <div className="create-user-modal__row">
                        <div className="create-user-modal__group">
                            <label>ชื่อจริง:</label>
                            <input
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="create-user-modal__group">
                            <label>นามสกุล:</label>
                            <input
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="create-user-modal__group">
                        <label>อีเมล:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="create-user-modal__group">
                        <label>รหัสผ่าน:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="create-user-modal__actions">
                        <button
                            type="button"
                            className="create-user-modal__btn create-user-modal__btn--secondary"
                            onClick={onCancel}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="create-user-modal__btn create-user-modal__btn--primary"
                            disabled={loading}
                        >
                            {loading ? "กำลังเพิ่มผู้ใช้..." : "เพิ่มผู้ใช้"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateUserModal;
