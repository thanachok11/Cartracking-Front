import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import "../../styles/components/auth/ProtectedRoute.css";

interface ProtectedRouteProps {
  children: React.ReactNode;
  page?: string; // page สำหรับเช็ก allowedPages
}

const API_BASE_URL = process.env.REACT_APP_API_URL;

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

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, page }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!token || !page) {
      setAllowed(true);
      return;
    }

    axios
      .get(`${API_BASE_URL}/allowed-pages/check-page?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(() => setAllowed(true))
      .catch(() => setAllowed(false));
  }, [token, page]);

  if (!isTokenValid(token)) {
    if (token) localStorage.removeItem('token');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  if (allowed === null) return <div className="protected-loading">Loading...</div>;
  if (!allowed)
    return (
      <div className="protected-error">
        <div className="error-card">
          <h1>🚫 Access Denied</h1>
          <p>You do not have permission to view this page.</p>
        </div>
      </div>
    );

  return <>{children}</>;
};

export default ProtectedRoute;
