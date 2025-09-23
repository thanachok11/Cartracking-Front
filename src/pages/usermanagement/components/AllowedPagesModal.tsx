import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { fetchUsers, updateAllowedPages } from "../../../api/components/allowedPageApi";
import NotificationToast from "../../../components/common/NotificationToast";
import { useNotification } from "../../../hooks/useNotification";
import "../../../styles/components/NotificationToast.css";

interface User {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    allowedPages: string[];
}

const allPages = [
    "dashboard", "vehicles", "vehiclestail", "drivers",
    "containers", "management", "settings", "data-today", "map",
    "track", "allowed-pages-manager", "workorder",
];

interface AllowedPagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string | null;
}

const AllowedPagesModal: React.FC<AllowedPagesModalProps> = ({ isOpen, onClose, targetUserId }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const token = localStorage.getItem("token");

    // notification hook
    const { 
        notification, 
        progress, 
        showNotification, 
        handleMouseEnter, 
        handleMouseLeave 
    } = useNotification();

    // โหลดข้อมูล user
    useEffect(() => {
        if (!isOpen || !token || !targetUserId) return;

        fetchUsers(token)
            .then((users: User[]) => {
                const user = users.find((u: User) => u._id === targetUserId) || null;
                setSelectedUser(user);
                setSelectedPages(user?.allowedPages || []);
            })
            .catch(err => {
                console.error(err);
                setSelectedUser(null);
                setSelectedPages([]);
            });

    }, [isOpen, token, targetUserId]);

    const togglePage = (page: string) => {
        setSelectedPages(prev =>
            prev.includes(page) ? prev.filter(p => p !== page) : [...prev, page]
        );
    };

    const savePages = () => {
        if (!selectedUser || !token) return;

        updateAllowedPages(token, selectedUser._id, selectedPages)
            .then(() => {
                showNotification("บันทึกสำเร็จ! ✅", "success", { 
                    autoCloseModal: true, 
                    onClose: onClose 
                });
            })
            .catch(err => {
                console.error(err.response?.data || err);
                showNotification("เกิดข้อผิดพลาด ❌", "error");
            });
    };
    const pageLabels: { [key: string]: string } = {
        "dashboard": "แดชบอร์ด",
        "map": "GPS รถบรรทุก",
        "track": "GPS คอนเทนเนอร์",
        "data-today": "เพิ่มงานและออกรายงาน",
        "drivers": "คนขับ",
        "vehicles": "ทะเบียนหัว",
        "vehiclestail": "ทะเบียนท้าย",
        "containers": "ตู้คอนเทนเนอร์",
        "management": "การจัดการผู้ใช้",
        "allowed-pages-manager":"จัดการสิทธ์เข้าใช้งานหน้า",
        "workorder": "ใบสั่งงาน",
    };

    if (!isOpen || !selectedUser) return null;

    return (
        <div className="allowed-pages-modal-overlay">
            <div className="allowed-pages-modal">
                <div className="allowed-pages-modal-header">
                    <h2 className="allowed-pages-modal-title">
                        จัดการสิทธิ์เข้าใช้งาน: {selectedUser.firstName} {selectedUser.lastName}
                    </h2>
                    <button className="allowed-pages-modal-close-btn" onClick={onClose}>
                        <FontAwesomeIcon icon={faTimes} />
                    </button>
                </div>

                <div className="allowed-pages-modal-body">
                    <div className="pages-access">
                        <h3 className="pages-access-title">สิทธิ์การเข้าถึงหน้า</h3>

                        {/* ปุ่มติ๊ก/ล้างทั้งหมด */}
                        <div className="pages-access-actions" style={{ marginBottom: '10px' }}>
                            <button
                                className="select-all-btn"
                                onClick={() => setSelectedPages([...allPages])}
                            >
                                เลือกทั้งหมด
                            </button>
                            <button
                                className="clear-all-btn"
                                onClick={() => setSelectedPages([])}
                                style={{ marginLeft: '8px' }}
                            >
                                ล้างทั้งหมด
                            </button>
                        </div>

                        <div className="pages-access-list">
                            {allPages.map(page => (
                                <label key={page} className="pages-access-item">
                                    <input
                                        type="checkbox"
                                        checked={selectedPages.includes(page)}
                                        onChange={() => togglePage(page)}
                                    />
                                    {pageLabels[page] || page} {/* แสดง label */}
                                </label>
                            ))}

                        </div>
                    </div>
                </div>

                <div className="allowed-pages-modal-footer">
                    <button className="allowed-pages-modal-save-btn" onClick={savePages}>
                        <FontAwesomeIcon icon={faSave} /> บันทึก
                    </button>
                </div>
            </div>

            {/* Notification Toast */}
            <NotificationToast
                message={notification?.message}
                type={notification?.type}
                progress={progress}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />
        </div>
    );
};

export default AllowedPagesModal;
