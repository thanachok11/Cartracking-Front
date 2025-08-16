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
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { logoutUser } from "../../api/auth/auth";
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

    const [userDropdown, setUserDropdown] = useState(false);
    const userRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded: any = jwtDecode(token);
                setUser({
                    name: decoded.name,
                    email: decoded.email,
                    role: decoded.role,
                    profileImg: decoded.profile_img || "default-avatar.png"
                });
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
    }, []);

    const handleLogout = () => {
        // ใช้ logout function จาก auth.ts
        logoutUser();
        setUser(null);
        
        // กลับไป landing page โดยตรง
        navigate("/", { replace: true });
        
        // ✅ รีเฟรชหน้าใหม่เพื่อให้ App.tsx อัปเดต token state
        setTimeout(() => {
            window.location.reload();
        }, 500); // ลดเวลารอให้เร็วขึ้น
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

    return (
        <aside className={`sidebar ${isSidebarOpen ? "open" : "collapsed"}`}>
            {/* Toggle Button */}
            <div className="sidebar-toggle" onClick={toggleSidebar}>
                <FontAwesomeIcon icon={isSidebarOpen ? faChevronLeft : faChevronRight} />
            </div>

            <div className="sidebar-title">
                {isSidebarOpen && "Car Tracking"}
            </div>

            <nav className="sidebar-menu">
                <button onClick={() => navigate("/dashboard")}>
                    <FontAwesomeIcon icon={faTachometerAlt} /> {isSidebarOpen && <span>Dashboard</span>}
                </button>
                <button onClick={() => navigate("/map")}>
                    <FontAwesomeIcon icon={faMapMarkedAlt} /> {isSidebarOpen && <span>Map</span>}
                </button>
                
                {/* Vehicle dropdown menu */}
                <div className="vehicle-menu-container">
                    <div className="vehicle-menu-button">
                        <FontAwesomeIcon icon={faCar} /> 
                        {isSidebarOpen && <span>Information</span>}
                    </div>
                    
                    {isSidebarOpen && (
                        <div className="vehicle-dropdown-menu">
                            <button onClick={() => navigate("/vehicles")}>
                                <FontAwesomeIcon icon={faCar} /> Vehicles
                            </button>
                            <button onClick={() => navigate("/drivers")}>
                                <FontAwesomeIcon icon={faUsers} /> Drivers
                            </button>
                            <button onClick={() => navigate("/containers")}>
                                <FontAwesomeIcon icon={faBox} /> Container
                            </button>

                        </div>
                    )}
                    <button onClick={() => navigate("/track")}>
                        <FontAwesomeIcon icon={faBox} /> {isSidebarOpen && <span>Track Containers</span>}
                    </button>
                </div>
            </nav>

            {/* ✅ User Info */}
            {user && (
                <div className="sidebar-user" ref={userRef}>
                    <div
                        className="user-summary"
                        onClick={() => setUserDropdown(!userDropdown)}
                    >
                        <img src={user.profileImg} alt="avatar" className="avatar" />
                        {isSidebarOpen && (
                            <>
                                <div className="user-details">
                                    <span className="username">{user.email}</span>
                                    <span className="role">🟢 {user.role}</span>
                                </div>
                                <FontAwesomeIcon icon={faCaretDown} className="caret-icon" />
                            </>
                        )}
                    </div>

                    {userDropdown && isSidebarOpen && (
                        <div className="user-dropdown-menu">
                            <button onClick={() => navigate("/settingProfile")}>
                                <FontAwesomeIcon icon={faCog} /> Settings
                            </button>
                            <button onClick={handleLogout}>
                                <FontAwesomeIcon icon={faSignOutAlt} /> Logout
                            </button>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
};

export default Sidebar;
