import { useState } from "react";
import "../styles/pages/ForgotPassword.css";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [isError, setIsError] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isClosing, setIsClosing] = useState(false); // สำหรับ fade out

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("https://cartracking.up.railway.app/api/auth/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            setMessage(data.message);
            setIsError(!res.ok);
        } catch (err) {
            setMessage("Error sending reset link");
            setIsError(true);
        }
    };

    return (
        <div className="forgot-container">
            <div className={`forgot-card ${isClosing ? "fade-out" : "fade-in"}`}>
                <h2 className="forgot-title">ลืมรหัสผ่าน ?</h2>
                <p className="forgot-subtitle">
                    ใส่อีเมลจริงที่สมัครไว้กับระบบเพื่อที่จะรีเซ็ตรหัสผ่าน ระบบจะส่ง link ไปยังอีเมลของท่าน.
                </p>
                <form onSubmit={handleSubmit} className="forgot-form">
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="forgot-input"
                        required
                    />
                    <button type="submit" className="forgot-button">
                        Send Reset Link
                    </button>
                </form>
                {message && (
                    <p className={`forgot-message ${isError ? "forgot-message-error" : ""}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
}
