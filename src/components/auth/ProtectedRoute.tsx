import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;
  
  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    
    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Invalid token:', error);
    return false;
  }
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();

  if (!isTokenValid(token)) {
    if (token) {
      localStorage.removeItem('token');
      console.log('🚫 Token expired, removed from localStorage');
    }
    
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ถ้ามี token ที่ valid แล้วให้แสดงหน้าที่ต้องการ
  return <>{children}</>;
};

export default ProtectedRoute;
