import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/pages/Unauthorized.css';

const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // หน้าที่พยายามเข้าถึงก่อนหน้า
  const intendedPath = location.state?.from?.pathname || '/dashboard';

  const handleLoginRedirect = () => {
    navigate('/', { state: { from: location.state?.from } });
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-content">
        <div className="unauthorized-icon">🔐</div>
        <h1>Access Denied</h1>
        <h2>เข้าถึงไม่ได้</h2>
        <p>คุณต้องเข้าสู่ระบบก่อนเพื่อเข้าถึงหน้า <strong>{intendedPath}</strong></p>
        
        <div className="unauthorized-actions">
          <button 
            onClick={handleLoginRedirect}
            className="login-button"
          >
            🔑 เข้าสู่ระบบ
          </button>
          <button 
            onClick={handleGoHome}
            className="home-button"
          >
            🏠 กลับหน้าหลัก
          </button>
        </div>
        
        <div className="unauthorized-info">
          <h3>ทำไมถึงเห็นหน้านี้?</h3>
          <ul>
            <li>คุณยังไม่ได้เข้าสู่ระบบ</li>
            <li>Session ของคุณหมดอายุแล้ว</li>
            <li>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
