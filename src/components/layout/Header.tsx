import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignInAlt, faUserPlus } from "@fortawesome/free-solid-svg-icons";

import LoginPageModal from "../auth/LoginPageModal";
import RegisterPageModal from "../auth/RegisterPageModal";
import "../../styles/components/layout/Header.css";
import LanguageSwitcher from "../common/LanguageSwitcher";
import { useI18n } from "../../i18n";

interface NavbarProps {
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
}

const Header: React.FC<NavbarProps> = ({ isSidebarOpen = false }) => {
    const [isLoginModalVisible, setIsLoginModalVisible] = useState(false);
    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Toggle state
    const { t } = useI18n();

    return (
        <>
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-content">
                    {/* Logo */}
                    <div className={`iconName ${isSidebarOpen ? "shifted" : ""}`}>
                        {t('header.companyName')}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <LanguageSwitcher />
                        {/* Hamburger Toggle */}
                        <div
                            className={`hamburger ${isMenuOpen ? "active" : ""}`}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            style={{ marginLeft: 12 }}
                        >
                            <span className="bar"></span>
                            <span className="bar"></span>
                            <span className="bar"></span>
                        </div>
                    </div>

                    {isMenuOpen && (
                        <div className={`nav-right ${isMenuOpen ? "show" : ""}`}>
                            <button
                                onClick={() => setIsLoginModalVisible(true)}
                                className="login-button-header"
                            >
                                <FontAwesomeIcon icon={faSignInAlt} /> {t('header.signIn')}
                            </button>
                            <button
                                onClick={() => setIsRegisterModalVisible(true)}
                                className="register-button-header"
                            >
                                <FontAwesomeIcon icon={faUserPlus} /> {t('header.signUp')}
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
