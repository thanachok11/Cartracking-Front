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
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useLocation } from "react-router-dom";
import { getUserPermissions, logoutUser } from "../../api/auth/auth";
import { getRoleName, UserRole } from "../../types/User";
import "../../styles/components/layout/Sidebar.css";

interface SidebarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSidebarOpen, toggleSidebar }) => {
    const [user, setUser] = useState<{
        name: string;
        email: string;
        role: string;
        profileImg: string;
    } | null>(null);
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
                        const displayName = user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`.trim()
                            : user.email;
                            
                        setUser({
                            name: displayName,
                            email: user.email,
                            role: getRoleName(user.role as UserRole),
                            profileImg: "https://res.cloudinary.com/dboau6axv/image/upload/v1735641173/qa9dfyxn_yxhcg6.jpg"
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

    // Get current page for active state
    const isActivePage = (path: string) => {
        return location.pathname === path;
    };

    const menuItems = [
        { path: "/dashboard", icon: faTachometerAlt, label: "Dashboard", tooltip: "Dashboard" },
        { path: "/map", icon: faMapMarkedAlt, label: "Map", tooltip: "Map View" },
        { path: "/track", icon: faBox, label: "Track Containers", tooltip: "Track Containers" },
    ];

    const informationItems = [
        { path: "/vehicles", icon: faCar, label: "Vehicles", tooltip: "Vehicles" },
        { path: "/drivers", icon: faUsers, label: "Drivers", tooltip: "Drivers" },
        { path: "/containers", icon: faBox, label: "Container", tooltip: "Container" },
    ];

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
                {/* Toggle Button */}
                <div className="sidebar-toggle" onClick={toggleSidebar}>
                    <FontAwesomeIcon 
                        icon={isMobile ? (isSidebarOpen ? faTimes : faBars) : (isSidebarOpen ? faChevronLeft : faChevronRight)} 
                    />
                </div>

                <div className="sidebar-title">
                    {(isSidebarOpen || isMobile) && "Car Tracking"}
                </div>


                <nav className="sidebar-menu">
                    {/* Main menu items */}
                    {menuItems.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={isActivePage(item.path) ? "active" : ""}
                            data-tooltip={item.tooltip}
                        >
                            <FontAwesomeIcon icon={item.icon} />
                            {(isSidebarOpen || isMobile) && <span>{item.label}</span>}
                        </button>
                    ))}
                    
                    {/* Information dropdown menu */}
                    <div className="vehicle-menu-container">
                        <div className="vehicle-menu-button">
                            <FontAwesomeIcon icon={faCar} />
                            {(isSidebarOpen || isMobile) && <span>Information</span>}
                        </div>
                        
                        {(isSidebarOpen || isMobile) && (
                            <div className="vehicle-dropdown-menu">
                                {informationItems.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className={isActivePage(item.path) ? "active" : ""}
                                    >
                                        <FontAwesomeIcon icon={item.icon} />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* User Info */}
                {user && (
                    <div className="sidebar-user" ref={userRef}>
                        <div
                            className="user-summary"
                            onClick={() => setUserDropdown(!userDropdown)}
                        >
                            <img src={user.profileImg} alt="avatar" className="avatar" />
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
