import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/pages/ResetPassword.css";

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    const [isClosing, setIsClosing] = useState(false); // fade out

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("https://cartracking.up.railway.app/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword }),
            });
            const data = await res.json();
            setMessage(data.message);
            setIsError(!res.ok);
        } catch (err) {
            setMessage("Error resetting password");
            setIsError(true);
        }
    };

    return (
        <div className="reset-container">
            <div className={`reset-card ${isClosing ? "fade-out" : "fade-in"}`}>
                <h2 className="reset-title">Reset Password</h2>
                <p className="reset-subtitle">
                    Enter your new password below to reset your account password.
                </p>
                <form onSubmit={handleSubmit} className="reset-form">
                    <div className="reset-input-group">
                        <label className="reset-label">New Password</label>
                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="reset-input"
                            required
                        />
                    </div>
                    <button type="submit" className="reset-button">
                        Reset Password
                    </button>
                </form>
                {message && (
                    <p className={`reset-message ${isError ? "reset-message-error" : "reset-message-success"}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
