import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, saveToken } from "../../api/auth/auth";
import "../../styles/components/auth/LoginPageModal.css";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface LoginProps {
    isVisible: boolean;
    onClose: () => void;
}

const Login: React.FC<LoginProps> = ({ isVisible, onClose }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();

    if (!isVisible) return null;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccessMessage("");

        try {
            const data = await loginUser(email, password);

            saveToken(data.token);
            localStorage.setItem("userEmail", email);

            // ใช้ JWT decode เพื่อหา allowedPages
            const { jwtDecode } = require('jwt-decode');
            const decoded: any = jwtDecode(data.token);
            const allowedPages = decoded.allowedPages || [];
            
            console.log('🔍 Login redirect - allowedPages:', allowedPages);

            let redirectPath = "/dashboard"; // default
            
            if (data.role === "employee") {
                redirectPath = "/employee-dashboard";
            } else if (allowedPages.includes("dashboard")) {
                redirectPath = "/dashboard"; // ✅ ถ้ามี dashboard → ไป dashboard
            } else if (allowedPages.length > 0) {
                redirectPath = `/${allowedPages[0]}`;
            } else {
                redirectPath = location.state?.from?.pathname || "/dashboard";
            }

            console.log('🔍 Login redirect path:', redirectPath);
            navigate(redirectPath, { replace: true });

            setSuccessMessage("Login Success!");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (err: any) {
            setError(err.message || "Error logging in. Please try again.");
        }
    };

    const handleClose = () => {
        setIsClosing(true);

        setTimeout(() => {
            setIsClosing(false);
            onClose();
        }, 300);
    };

    const handleForgotPassword = () => {
        onClose(); // ปิด modal ก่อน
        navigate("/forgot-password");
    };

    return (
        <div className="login-modal-overlay">
            <div className="login-model-content">
                <div className={`login-modal ${isClosing ? 'slide-out' : 'slide-in'}`}>
                    <button onClick={handleClose} className="login-close-button">×</button>
                    <form onSubmit={handleLogin} className="login-form">
                        <h2 className="login-title">เข้าสู่ระบบ</h2>
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            required
                        />
                            <input
                                type={showPassword ? "text" : "password"} // สลับ type
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="login-input"
                                required
                            />
                            <span
                                className="password-toggle-icon"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                            </span>
                       
                        <div className="login-checkbox-container">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={() => setRememberMe(!rememberMe)}
                            />
                            <label htmlFor="rememberMe" className="login-label">
                                Remember me
                            </label>
                        </div>

                        <button type="submit" className="login-button">Login</button>

                        <p
                            className="login-forgot"
                            onClick={handleForgotPassword}
                        >
                            Forgot Password?
                        </p>

                        {error && <p className="login-error">{error}</p>}
                        {successMessage && <p className="login-success">{successMessage}</p>}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
