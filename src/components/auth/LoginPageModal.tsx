import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginUser, saveToken } from "../../api/auth/auth";
import "../../styles/components/auth/LoginPageModal.css";

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

            // ตรวจสอบว่ามีหน้าที่ต้องการเข้าถึงก่อน login หรือไม่
            const from = location.state?.from?.pathname || "/dashboard";

            if (data.role === "employee") {
                navigate("/employee-dashboard");
            } else {
                // redirect ไปหน้าที่ต้องการหรือ dashboard (เป็น default)
                navigate(from, { replace: true });
            }

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

    return (
        <div className="login-modal-overlay">
            <div className="login-model-content">
            <div className={`login-modal ${isClosing ? 'slide-out' : 'slide-in'}`}>
                <button onClick={handleClose} className="login-close-button">×</button>
                <form onSubmit={handleLogin} className="login-form">
                    <h2 className="login-title">Login</h2>
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
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                        required
                    />
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
                    {error && <p className="login-error">{error}</p>}
                    {successMessage && <p className="login-success">{successMessage}</p>}
                </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
