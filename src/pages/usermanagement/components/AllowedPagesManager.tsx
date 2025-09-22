import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from 'react-router-dom';

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
        "user": "ผู้ใช้งานทั่วไป",
        "manager": "ผู้จัดการ",
        "admin": "ผู้ดูแลระบบ",
    };

    const pageLabels: { [key: string]: string } = {
        "/dashboard": "แดชบอร์ด",
        "/map": "GPS รถบรรทุก",
        "/track": "GPS คอนเทนเนอร์",
        "/data-today": "เพิ่มงานและออกรายงาน",
        "/drivers": "คนขับ",
        "/vehicles": "ทะเบียนหัว",
        "/vehiclestail": "ทะเบียนท้าย",
        "/containers": "ตู้คอนเทนเนอร์",
        "/management": "การจัดการผู้ใช้",
        "/settings": "การตั้งค่า",
        "/workorder": "ใบสั่งงาน",
    };

    return (
        <div className="allowed-pages-manager-page">
            <h2 className="apm-title">จัดการสิทธิ์ผู้ใช้</h2>
            <button className="back-btn" onClick={() => navigate(-1)}>⬅ ย้อนกลับ</button>

            <table className="apm-user-table">
                <thead>
                    <tr>
                        <th>ชื่อ</th>
                        <th>Email</th>
                        <th>บทบาท</th>
                        <th>สิทธิ์เข้าถึงหน้า</th>
                        <th>จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {users
                         // ซ่อน super admin
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
                                        : "ไม่มีสิทธ์เข้าถึงหน้าอื่นๆ"
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
                                        แก้ไขสิทธิ์
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
