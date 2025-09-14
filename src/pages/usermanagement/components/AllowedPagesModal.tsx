import React, { useEffect, useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faSave } from "@fortawesome/free-solid-svg-icons";
import { fetchUsers, updateAllowedPages } from "../../../api/components/allowedPageApi";

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
    "allowed-pages-manager"
];

interface AllowedPagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetUserId: string | null;
}

const NOTIFICATION_DURATION = 2500; // ms

const AllowedPagesModal: React.FC<AllowedPagesModalProps> = ({ isOpen, onClose, targetUserId }) => {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedPages, setSelectedPages] = useState<string[]>([]);
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
    const [progress, setProgress] = useState(0);
    const hoveringRef = useRef(false);
    const timerRef = useRef<NodeJS.Timer | null>(null);
    const startTimeRef = useRef<number>(0);
    const remainingTimeRef = useRef<number>(NOTIFICATION_DURATION);
    const token = localStorage.getItem("token");

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

    const showNotification = (message: string, type: 'success' | 'error', autoCloseModal = false) => {
        setNotification({ message, type });
        setProgress(0);
        remainingTimeRef.current = NOTIFICATION_DURATION;
        startTimeRef.current = Date.now();

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(() => {
            if (!hoveringRef.current) {
                const elapsed = Date.now() - startTimeRef.current;
                const newProgress = (elapsed / remainingTimeRef.current) * 100;
                setProgress(newProgress);

                if (elapsed >= remainingTimeRef.current) {
                    clearInterval(timerRef.current!);
                    timerRef.current = null;
                    setNotification(null);
                    if (autoCloseModal) onClose();
                }
            } else {
                // ถ้า hover หยุด timer ชั่วคราว โดยไม่เพิ่ม progress
                startTimeRef.current = Date.now() - (progress / 100) * remainingTimeRef.current;
            }
        }, 20);
    };

    const handleMouseEnter = () => {
        hoveringRef.current = true;
    };

    const handleMouseLeave = () => {
        hoveringRef.current = false;
        startTimeRef.current = Date.now() - (progress / 100) * remainingTimeRef.current;
    };

    const savePages = () => {
        if (!selectedUser || !token) return;

        updateAllowedPages(token, selectedUser._id, selectedPages)
            .then(() => {
                showNotification("บันทึกสำเร็จ! ✅", "success", true);
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
        "settings": "การตั้งค่า",
        "allowed-pages-manager":"จัดการสิทธ์เข้าใช้งานหน้า"
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

            {notification && (
                <div
                    className={`notification-toast ${notification.type}`}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    {notification.message}
                    <div
                        className="notification-progress"
                        style={{
                            width: `${progress}%`,
                            transition: hoveringRef.current ? "none" : "width 0.02s linear"
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default AllowedPagesModal;
