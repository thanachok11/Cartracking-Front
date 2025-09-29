import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';
import { useI18n } from "../../../i18n";

import AllowedPagesModal from "./AllowedPagesModal"; // import modal
import "../../../styles/pages/AllowedModal.css"
import "../../../styles/pages/AllowedPage.css"
import { fetchUsers, updateAllowedPages } from "../../../api/components/allowedPageApi";

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    allowedPages: string[];
}

const AllowedPagesManager: React.FC = () => {
    const { t } = useI18n();
    const [users, setUsers] = useState<User[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    // โหลด user list
    useEffect(() => {
        if (!token) return;

        fetchUsers(token)
            .then(usersArray => setUsers(usersArray || []))
            .catch(err => console.error(err));
    }, [token, isModalOpen]);

    const roleLabels: { [key: string]: string } = {
        "user": t('roles.user'),
        "manager": t('roles.manager'),
        "admin": t('roles.admin'),
    };

    const pageLabels: { [key: string]: string } = {
        "/dashboard": t('nav.dashboard'),
        "/map": t('nav.map'),
        "/track": t('nav.track'),
        "/data-today": t('nav.dataToday'),
        "/drivers": t('nav.drivers'),
        "/vehicles": t('nav.vehicles'),
        "/vehiclestail": t('nav.vehiclesTail'),
        "/containers": t('nav.containers'),
        "/management": t('nav.management'),
        "/settings": t('nav.settings'),
        "/workorder": t('nav.workorder'),
    };

    return (
        <div className="allowed-pages-manager-page">
            <h2 className="apm-title">{t('allowedPages.title')}</h2>
            <button className="back-btn" onClick={() => navigate(-1)}>{t('allowedPages.back')}</button>

            <table className="apm-user-table">
                <thead>
                    <tr>
                        <th>{t('allowedPages.table.name')}</th>
                        <th>{t('allowedPages.table.email')}</th>
                        <th>{t('allowedPages.table.role')}</th>
                        <th>{t('allowedPages.table.pages')}</th>
                        <th>{t('allowedPages.table.actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {users
                         // ซ่อน super admin
                        .filter(user => user.role?.toLowerCase() !== "super admin")
                        .map(user => (
                            <tr key={user._id}>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{roleLabels[user.role] || user.role}</td>

                                <td className="apm-allowed-pages">
                                    {user.allowedPages.length > 0
                                        ? user.allowedPages.map((page, idx) => (
                                            <span key={idx} className="apm-page-tag">
                                                {pageLabels[`/${page}`] || page}
                                            </span>
                                        ))
                                        : t('allowedPages.noPages')
                                    }
                                </td>

                                <td>
                                    <button
                                        className="apm-edit-btn"
                                        onClick={() => {
                                            setSelectedUserId(user._id);
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        {t('allowedPages.edit')}
                                    </button>
                                </td>
                            </tr>
                        ))}
                </tbody>

            </table>

            {isModalOpen && (
                <AllowedPagesModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    targetUserId={selectedUserId}
                />
            )}
        </div>

    );
};

export default AllowedPagesManager;
