import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons";

import LoginPageModal from "../auth/LoginPageModal";
import RegisterPageModal from "../auth/RegisterPageModal";
import "../../styles/components/layout/Header.css";

interface NavbarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Header: React.FC<NavbarProps> = ({ isSidebarOpen = false }) => {
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Toggle state

    return (
        <>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-content">
                    {/* Logo */}
                    <div className={`iconName ${isSidebarOpen ? "shifted" : ""}`}>
                        PORCHOEN 2014 COMPANY LIMITED
                    </div>

                    {/* Hamburger Toggle */}
                    <div
                        className={`hamburger ${isMenuOpen ? "active" : ""}`}
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        <span className="bar"></span>
                        <span className="bar"></span>
                        <span className="bar"></span>
                    </div>

                    {isMenuOpen && (
                        <div className={`nav-right ${isMenuOpen ? "show" : ""}`}>
                            <button
                                onClick={() => setIsLoginModalVisible(true)}
                                className="login-button-header"
                            >
                                <FontAwesomeIcon icon={faSignInAlt} /> Login
                            </button>
                            <button
                                onClick={() => setIsRegisterModalVisible(true)}
                                className="register-button-header"
                            >
                                <FontAwesomeIcon icon={faUserPlus} /> Register
                            </button>
                        </div>
                    )}

                </div>
            </nav>

            {/* Login / Register Modal */}
            <LoginPageModal
                isVisible={isLoginModalVisible}
                onClose={() => setIsLoginModalVisible(false)}
            />
            <RegisterPageModal
                isVisible={isRegisterModalVisible}
                onClose={() => setIsRegisterModalVisible(false)}
            />
        </>
    );
};

export default Header;
