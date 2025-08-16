import React from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUser } from '../api/auth/auth';
import '../styles/pages/LogoutPage.css';

const LogoutPage: React.FC = () => {
  const navigate = useNavigate();

  const handleConfirmLogout = () => {
    logoutUser();
    navigate('/', { replace: true });
    window.location.reload();
  };

  const handleCancel = () => {
    navigate(-1); // กลับไปหน้าที่แล้ว
  };

  return (
    <div className="logout-container">
      <div className="logout-content">
        <div className="logout-icon">👋</div>
        <h1>Logout Confirmation</h1>
        <h2>ยืนยันการออกจากระบบ</h2>
        <p>คุณต้องการออกจากระบบหรือไม่?</p>
        
        <div className="logout-actions">
          <button 
            onClick={handleConfirmLogout}
            className="confirm-button"
          >
            🚪 ยืนยันออกจากระบบ
          </button>
          <button 
            onClick={handleCancel}
            className="cancel-button"
          >
            ❌ ยกเลิก
          </button>
        </div>
        
        <div className="logout-info">
          <p>เมื่อออกจากระบบแล้ว:</p>
          <ul>
            <li>ข้อมูล session จะถูกลบ</li>
            <li>คุณจะกลับไปหน้า Login</li>
            <li>ต้องเข้าสู่ระบบใหม่เพื่อใช้งาน</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
