import axios from "axios";
import React, { useState, useEffect } from "react";
import Header from "./components/layout/Header";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VehicleTimelinePage from "./pages/VehicleTimeline";
import HomePage from "./components/landingPage/LandingPage";
import Sidebar from "./components/layout/Sidebar";
import { GoogleMapsProvider } from "./pages/GoogleMapsProvider";
import Drivers from "./pages/driver/DriverPage";
import VehiclePage from "./pages/vehicles/VehiclePage";
import ContainerPage from "./pages/container/containerpage";
import Dashboard from "./pages/Dashboard";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import UserManagement from "./pages/usermanagement/usermanagement";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DriverProfilePage from "./pages/driver/components/DriverProfilePage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Userinfo from "./pages/userinfo/userinfo";
import DataTodayPage from "./pages/datatoday/DataTodayPage";
import NotFoundPage from "./components/layout/NotFoundPage";
import WorkOrderPage from "./pages/workorder/WorkOrderPage";
import VehicleTailPage from "./pages/vehicles/VehicleTailPage";
import AllowedPagesManager from "./pages/usermanagement/components/AllowedPagesManager";
import "./App.css";
import "./styles/i18n-fonts.css";
import { jwtDecode } from "jwt-decode";
import { logoutUser, renewToken } from "./api/auth/auth";

// Interceptor สำหรับ logout อัตโนมัติเมื่อ 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      logoutUser();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;

    let timeoutId: NodeJS.Timeout;
    let heartbeatId: NodeJS.Timeout;
    let lastRenewTime = 0;
    const COOLDOWN_MS = 5 * 60 * 1000; // 5 นาที
    const HEARTBEAT_MS = 10 * 60 * 1000; // 10 นาที

    const isTokenExpiringSoon = (token: string | null, bufferSeconds = 60) => {
      if (!token) return true;
      try {
        const decoded: any = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        return decoded.exp - currentTime < bufferSeconds;
      } catch {
        return true;
      }
    };

    // ✅ activity-based renew
    const activityDetected = () => {
      clearTimeout(timeoutId);

      const currentToken = localStorage.getItem("token");
      const now = Date.now();

      const enoughTimePassed = now - lastRenewTime > COOLDOWN_MS;
      const tokenIsExpiring = isTokenExpiringSoon(currentToken, 60);

      if (tokenIsExpiring && enoughTimePassed && currentToken) {
        renewToken(currentToken).then((ok) => {
          if (ok) lastRenewTime = Date.now();
        });
      }

      timeoutId = setTimeout(() => {
        // allow next renew after cooldown
      }, COOLDOWN_MS);
    };

    // ✅ heartbeat-based renew
    const startHeartbeat = () => {
      heartbeatId = setInterval(() => {
        const currentToken = localStorage.getItem("token");
        if (currentToken) {
          console.log("💓 Heartbeat: renewing token...");
          renewToken(currentToken).then((ok) => {
            if (ok) lastRenewTime = Date.now();
          });
        }
      }, HEARTBEAT_MS);
    };

    const stopHeartbeat = () => {
      if (heartbeatId) clearInterval(heartbeatId);
    };

    // เริ่ม heartbeat ตอน mount
    startHeartbeat();

    // หยุด/เริ่ม heartbeat เวลา tab เปลี่ยนสถานะ
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("⏸️ Tab hidden → stop heartbeat");
        stopHeartbeat();
      } else {
        console.log("▶️ Tab active → start heartbeat");
        startHeartbeat();
      }
    });

    // ฟัง activity
    window.addEventListener("mousemove", activityDetected);
    window.addEventListener("keydown", activityDetected);

    return () => {
      clearTimeout(timeoutId);
      stopHeartbeat();
      window.removeEventListener("mousemove", activityDetected);
      window.removeEventListener("keydown", activityDetected);
      document.removeEventListener("visibilitychange", () => { });
    };
  }, [token]);

  return (
    <Router>
      <div
        className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"
          }`}
      >
        {!token && (
          <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        )}
        {token && (
          <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
        )}
        <div className="main-content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute page="dashboard">
                  <GoogleMapsProvider>
                    <Dashboard />
                  </GoogleMapsProvider>
                </ProtectedRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute page="vehicles">
                  <VehiclePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/allowed-pages-manager"
              element={
                <ProtectedRoute page="allowed-pages-manager">
                  <AllowedPagesManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehicle/:id/view"
              element={
                <ProtectedRoute page="vehicle">
                  <VehicleTimelinePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedRoute page="drivers">
                  <Drivers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/drivers/:id"
              element={
                <ProtectedRoute page="drivers">
                  <DriverProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/containers"
              element={
                <ProtectedRoute page="containers">
                  <ContainerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workorder"
              element={
                <ProtectedRoute page="workorder">
                  <WorkOrderPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/management"
              element={
                <ProtectedRoute page="management">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Userinfo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/data-today"
              element={
                <ProtectedRoute page="data-today">
                  <DataTodayPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/vehiclestail"
              element={
                <ProtectedRoute page="vehiclestail">
                  <VehicleTailPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
