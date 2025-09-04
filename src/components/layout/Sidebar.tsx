import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faMapMarkedAlt,
    faCar,
    faSignOutAlt,
    faCog,
    faCaretDown,
    faChevronLeft,
    faChevronRight,
    faUsers,
    faBox,
    faTachometerAlt,
    faBars,
    faTimes,
    faUserCog,
    faFileAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserPermissions, logoutUser } from "../../api/auth/auth";
import { getRoleName, UserRole } from "../../types/User";
import "../../styles/components/layout/Sidebar.css";

// Define UserProfile type
type UserProfile = {
    name: string;
    email: string;
    role: string;
    profile_img?: string;
};

interface SidebarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [userPermissions, setUserPermissions] = useState<any>(null);
    const [userDropdown, setUserDropdown] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const userRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();
    const location = useLocation();

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile && isSidebarOpen) {
            toggleSidebar();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname, isMobile]);

    useEffect(() => {
        const loadUserData = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const permissions = await getUserPermissions();
                    if (permissions) {
                        setUserPermissions(permissions);

                        const user = permissions.user as any;

                        // กำหนด display name
                        const displayName = user.firstName && user.lastName
                            ? `${user.firstName} ${user.lastName}`.trim()
                            : user.email;

                        // โหลด profile image และ fallback ถ้าไม่มี
                        const profileImg = user.profileImage || 'https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg';

                        setUser({
                            name: displayName,
                            email: user.email,
                            role: getRoleName(user.role as UserRole),
                            profile_img: profileImg
                        });
                    }
                } catch (error) {
                    console.error("Error loading user data:", error);
                    localStorage.removeItem("token");
                    setUser(null);
                }
            }
        };

        loadUserData();
    }, []);

    const handleLogout = () => {
        logoutUser();
        setUser(null);
        navigate("/", { replace: true });
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (userRef.current && !userRef.current.contains(target)) {
                setUserDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // helper: แปลง role string/number เป็น UserRole level
    const roleStringToLevel = (roleValue?: string | number | null): UserRole => {
        if (typeof roleValue === 'number') return roleValue as UserRole;
        const r = (roleValue || '').toString().toLowerCase();
        switch (r) {
            case 'super admin':
            case 'level_5':
            case 'level5':
            case '5':
                return UserRole.LEVEL_5;
            case 'admin':
            case 'level_4':
            case 'level4':
            case '4':
                return UserRole.LEVEL_4;
            case 'manager':
            case 'level_3':
            case 'level3':
            case '3':
                return UserRole.LEVEL_3;
            case 'user':
            case 'level_2':
            case 'level2':
            case '2':
                return UserRole.LEVEL_2;
            case 'viewer':
            case 'level_1':
            case 'level1':
            case '1':
                return UserRole.LEVEL_1;
            default:
                return UserRole.LEVEL_2; // default fallback
        }
    };

    // Get current page for active state
    const isActivePage = (path: string) => {
        return location.pathname === path;
    };

    const menuItems: Array<{
        path: string;
        icon: any;
        label: string;
        tooltip?: string;
        minRole?: UserRole; // ถ้าจำเป็นต้องมี role ขั้นต่ำ
    }> = [
        { path: "/dashboard", icon: faTachometerAlt, label: "แดชบอร์ด", tooltip: "Dashboard", minRole: UserRole.LEVEL_1 },
        { path: "/map", icon: faMapMarkedAlt, label: "GPS รถบรรทุก", tooltip: "Map View", minRole: UserRole.LEVEL_1 },
        { path: "/track", icon: faBox, label: "GPS คอนเทนเนอร์", tooltip: "Track Containers", minRole: UserRole.LEVEL_3 },
        { path: "/data-today", icon: faFileAlt, label: "เพิ่มงานและออกรายงาน", tooltip: "Data Today", minRole: UserRole.LEVEL_3 },
        { path: "/drivers", icon: faUsers, label: "คนขับ", tooltip: "Drivers", minRole: UserRole.LEVEL_3 },
        { path: "/vehicles", icon: faCar, label: "ทะเบียนหัว", tooltip: "Vehicles", minRole: UserRole.LEVEL_3 },
        { path: "/vehiclestail", icon: faCar, label: "ทะเบียนท้าย", tooltip: "Vehicles_tail", minRole: UserRole.LEVEL_3 },
        { path: "/containers", icon: faBox, label: "ตู้คอนเทนเนอร์", tooltip: "Container", minRole: UserRole.LEVEL_3 },
        { path: "/management", icon: faUserCog, label: "การจัดการผู้ใช้", tooltip: "User Management", minRole: UserRole.LEVEL_4 },
    ];

    // ก่อน render ให้คำนวณ role ของผู้ใช้และกรองเมนู
    const currentRoleLevel = roleStringToLevel(userPermissions?.user?.role || (user && user.role) || UserRole.LEVEL_2);

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && isSidebarOpen && (
                <div 
                    className="sidebar-overlay active" 
                    onClick={toggleSidebar}
                />
            )}

                <aside className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
                    {/* Header (Title + Toggle button) */}
                    <div className="sidebar-header">
                        <div className="sidebar-title">
                            {(isSidebarOpen || isMobile) && "Car Tracking"}
                        </div>
                        <div className="sidebar-toggle" onClick={toggleSidebar}>
                            <FontAwesomeIcon 
                                icon={isMobile 
                                    ? (isSidebarOpen ? faTimes : faBars) 
                                    : (isSidebarOpen ? faChevronLeft : faChevronRight)} 
                            />
                        </div>
                    </div>

                <nav className="sidebar-menu">
                    {menuItems
                        .filter(item => (item.minRole ? currentRoleLevel >= item.minRole : true))
                        .map((item) =>
                        <button
                            key={item.path}
                            onClick={() => {
                                if (item.path === "/track") {
                                    window.open("https://ucontainers.com.cn/login.php", "_blank");
                                } else {
                                    navigate(item.path);
                                }
                            }}
                            className={isActivePage(item.path) ? "active sidebar-link" : "sidebar-link"}
                            data-tooltip={item.tooltip}
                            style={{ textAlign: "left", display: "flex", alignItems: "center" }}
                        >
                            <FontAwesomeIcon icon={item.icon} />
                            {(isSidebarOpen || isMobile) && <span>{item.label}</span>}
                        </button>
                    )}
                </nav>

                {/* User Info */}
                {user && (
                    <div className="sidebar-user" ref={userRef}>
                        <div
                            className="user-summary"
                            onClick={() => setUserDropdown(!userDropdown)}
                        >
                            <img src={user.profile_img} alt="avatar" className="avatar" />
                            {(isSidebarOpen || isMobile) && (
                                <>
                                    <div className="user-details">
                                        <span className="username">{user.email}</span>
                                        <span className="role">🟢 {user.role}</span>
                                    </div>
                                    <FontAwesomeIcon icon={faCaretDown} className="caret-icon" />
                                </>
                            )}
                        </div>

                        {userDropdown && (isSidebarOpen || isMobile) && (
                            <div className="user-dropdown-menu">
                                {userPermissions?.permissions?.canAccessSettings && (
                                    <button onClick={() => navigate("/settings")}>
                                        <FontAwesomeIcon icon={faCog} /> Settings
                                    </button>
                                )}
                                <button onClick={handleLogout}>
                                    <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </aside>
        </>
    );
};

export default Sidebar;
