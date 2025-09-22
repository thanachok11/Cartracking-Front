import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/components/layout/NotFoundPage.css";

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="notfound-container">
            <h1 className="notfound-title">404</h1>
            <h2 className="notfound-subtitle">Oops! Page Not Found</h2>
            <p className="notfound-text">
                ขออภัย ไม่พบหน้าที่คุณต้องการ หรืออาจถูกลบไปแล้ว
            </p>
            <button className="notfound-button" onClick={() => navigate("/")}>
                ⬅ กลับสู่หน้าแรก
            </button>
        </div>
    );
};

export default NotFoundPage;
