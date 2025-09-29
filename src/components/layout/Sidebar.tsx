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
    faFileInvoice,
    faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserPermissions, logoutUser } from "../../api/auth/auth";
import { getRoleName, UserRole } from "../../types/User";
import "../../styles/components/layout/Sidebar.css";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useI18n } from "../../i18n";

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
    const { t } = useI18n();

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, []);

    // Close sidebar on mobile when route changes
    useEffect(() => {
        if (isMobile && isSidebarOpen) {
            toggleSidebar();
        }
    }, [location.pathname, isMobile, isSidebarOpen, toggleSidebar]);

    // Load user & permissions
    useEffect(() => {
        const loadUserData = async () => {
            const token = localStorage.getItem("token");
            if (token) {
                try {
                    const permissions = await getUserPermissions();
                    if (permissions) {
                        setUserPermissions(permissions);

                        const user = permissions.user as any;
                        const displayName =
                            user.firstName && user.lastName
                                ? `${user.firstName} ${user.lastName}`.trim()
                                : user.email;

                        const profileImg =
                            user.profileImage ||
                            "https://res.cloudinary.com/dboau6axv/image/upload/v1735641179/qa9dfyxn8spwm0nwtako.jpg";

                        setUser({
                            name: displayName,
                            email: user.email,
                            role: getRoleName(user.role as UserRole),
                            profile_img: profileImg,
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

    const handleLogout = async () => {
        try {
            await logoutUser();
        } catch (err) {
            console.error("Logout error:", err);
        }
        setUser(null);
        navigate("/", { replace: true });
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };


    // Close dropdown when click outside
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
        if (typeof roleValue === "number") return roleValue as UserRole;
        const r = (roleValue || "").toString().toLowerCase();
        switch (r) {
            case "super admin":
            case "level_5":
            case "level5":
            case "5":
                return UserRole.LEVEL_5;
            case "admin":
            case "level_4":
            case "level4":
            case "4":
                return UserRole.LEVEL_4;
            case "manager":
            case "level_3":
            case "level3":
            case "3":
                return UserRole.LEVEL_3;
            case "user":
            case "level_2":
            case "level2":
            case "2":
                return UserRole.LEVEL_2;
            default:
                return UserRole.LEVEL_2; // default fallback
        }
    };

    // Get current page for active state
    const isActivePage = (path: string) => {
        return location.pathname === path;
    };

    // All menu items
    const menuItems: Array<{
        path: string;
        icon: any;
        labelKey: string;
        tooltipKey?: string;
        minRole?: UserRole;
        externalUrl?: string; // ✅ external link
    }> = [
            { path: "/dashboard", icon: faTachometerAlt, labelKey: "nav.dashboard", tooltipKey: "nav.dashboard", minRole: UserRole.LEVEL_2 },
            { path: "/map", icon: faMapMarkedAlt, labelKey: "nav.map", tooltipKey: "nav.map", minRole: UserRole.LEVEL_2, externalUrl: "https://fleetweb-th.cartrack.com/" },
            { path: "/track", icon: faBox, labelKey: "nav.track", tooltipKey: "nav.track", minRole: UserRole.LEVEL_2, externalUrl: "https://ucontainers.com.cn/login.php" },
            { path: "/workorder", icon: faFileInvoice, labelKey: "nav.workorder", tooltipKey: "nav.workorder", minRole: UserRole.LEVEL_2 }, 
            { path: "/data-today", icon: faClipboardList, labelKey: "nav.dataToday", tooltipKey: "nav.dataToday", minRole: UserRole.LEVEL_2 },
            { path: "/drivers", icon: faUsers, labelKey: "nav.drivers", tooltipKey: "nav.drivers", minRole: UserRole.LEVEL_2 },
            { path: "/vehicles", icon: faCar, labelKey: "nav.vehicles", tooltipKey: "nav.vehicles", minRole: UserRole.LEVEL_2 },
            { path: "/vehiclestail", icon: faCar, labelKey: "nav.vehiclesTail", tooltipKey: "nav.vehiclesTail", minRole: UserRole.LEVEL_2 },
            { path: "/containers", icon: faBox, labelKey: "nav.containers", tooltipKey: "nav.containers", minRole: UserRole.LEVEL_2 },
            { path: "/management", icon: faUserCog, labelKey: "nav.management", tooltipKey: "nav.management", minRole: UserRole.LEVEL_3 },
        ];

    // Role ของ user ตอนนี้
    const currentRoleLevel = roleStringToLevel(
        userPermissions?.user?.role || (user && user.role) || UserRole.LEVEL_2
    );

    return (
        <>
            {/* Mobile overlay */}
            {isMobile && isSidebarOpen && (
                <div className="sidebar-overlay active" onClick={toggleSidebar} />
            )}

            <aside className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
                {/* Header */}
                <div className="sidebar-header">
                    <div className="sidebar-title">
                        {(isSidebarOpen || isMobile) && "Car Tracking"}
                    </div>
                <div className="sidebar-toggle" onClick={toggleSidebar}>
                    <FontAwesomeIcon
                        icon={
                            isMobile
                                ? isSidebarOpen
                                    ? faTimes
                                    : faBars
                                : isSidebarOpen
                                    ? faChevronLeft
                                    : faChevronRight
                        }
                    />
                </div>
            </div>

            {/* Language Switcher - แสดงเฉพาะเมื่อ sidebar เปิด หรืออยู่ในมือถือ */}
            {(isSidebarOpen || isMobile) && (
                <div style={{ padding: '0 12px', marginBottom: 8 }}>
                    <LanguageSwitcher />
                </div>
            )}                {/* Menu */}
                <nav className="sidebar-menu">
                    {(() => {
                        const allowedFiltered = menuItems.filter((item) =>
                            userPermissions?.allowedPages?.includes(
                                item.path.replace("/", "")
                            )
                        );

                        const roleFiltered = allowedFiltered.filter((item) =>
                            item.minRole ? currentRoleLevel >= item.minRole : true
                        );

                        return roleFiltered;
                    })().map((item) => (
                        <button
                            key={item.path}
                            onClick={() => {
                                if (item.externalUrl) {
                                    window.open(item.externalUrl, "_blank");
                                } else {
                                    navigate(item.path);
                                }
                            }}
                            className={
                                isActivePage(item.path)
                                    ? "active sidebar-link"
                                    : "sidebar-link"
                            }
                            data-tooltip={t(item.tooltipKey || item.labelKey)}
                            style={{
                                textAlign: "left",
                                display: "flex",
                                alignItems: "center",
                            }}
                        >
                            <FontAwesomeIcon icon={item.icon} />
                            {(isSidebarOpen || isMobile) && (
                                <span>{t(item.labelKey)}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User Info */}
                {user && (
                    <div className="sidebar-user" ref={userRef}>
                        <div
                            className="user-summary"
                            onClick={() => setUserDropdown(!userDropdown)}
                        >
                            <img
                                src={user.profile_img}
                                alt="avatar"
                                className="avatar"
                            />
                            {(isSidebarOpen || isMobile) && (
                                <>
                                    <div className="user-details">
                                        <span className="username">
                                            {user.email}
                                        </span>
                                        <span className="role">
                                            🟢 {user.role}
                                        </span>
                                    </div>
                                    <FontAwesomeIcon
                                        icon={faCaretDown}
                                        className="caret-icon"
                                    />
                                </>
                            )}
                        </div>
                        {userDropdown && (isSidebarOpen || isMobile) && (
                            <div className="user-dropdown-menu">
                                <button onClick={() => navigate("/settings")}>
                                    <FontAwesomeIcon icon={faCog} /> {t('common.settings')}
                                </button>
                                <button onClick={handleLogout}>
                                    <FontAwesomeIcon icon={faSignOutAlt} /> {t('common.logout')}
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
