import axios from "axios";
import React, { useState, useEffect } from "react";
import Header from "./components/layout/Header";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import VehicleTimelinePage from "./pages/VehicleTimeline";
import MapView from "./pages/map/GoogleMapView";
import HomePage from "./components/landingPage/LandingPage";
import Sidebar from "./components/layout/Sidebar";
import { GoogleMapsProvider } from "./pages/GoogleMapsProvider";
import Drivers from "./pages/driver/DriverPage";
import VehiclePage from "./pages/VehiclePage";
import ContainerPage from "./pages/container/containerpage";
import TrackContainersPage from "./pages/TrackContainer";
import Dashboard from "./pages/Dashboard";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import UserManagement from "./pages/usermanagement/usermanagement";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import DriverProfilePage from './pages/driver/components/DriverProfilePage';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Userinfo from "./pages/userinfo/userinfo";
import EventViewerPage from "./pages/EventViewerPage";
import ReportPage from "./pages/ReportPage";

import "./App.css";
import { jwtDecode } from "jwt-decode";
import { logoutUser } from "./api/auth/auth";

//Interceptor สำหรับ logout อัตโนมัติเมื่อ 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Logout อัตโนมัติเมื่อ token หมดอายุ
      logoutUser();
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);
const API_BASE_URL = process.env.REACT_APP_API_URL;

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return; // ยังไม่ login → ไม่ต้องติดตั้ง renew token

    let timeoutId: NodeJS.Timeout;
    let lastRenewTime = 0; // ⬅️ เวลาในรูป Unix timestamp (ms)

    const COOLDOWN_MS = 5 * 60 * 1000; //5 นาที

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
    // เรียก API renewCookie ที่ backend เพื่อ renew session cookie ด้วย
    const renewSessionCookie = async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/renewCookie`,
          {},
          { withCredentials: true }
        );
        console.log("🔄 Session cookie renewed successfully");
      } catch (err) {
        console.error("❌ Failed to renew session cookie:", err);
      }
    };

    const renewToken = async (oldToken: string) => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/renewToken`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${oldToken}`,
          },
        });

        if (!response.ok) throw new Error("Failed to renew token");

        const data = await response.json();
        if (data.token) {
          localStorage.setItem("token", data.token);
          lastRenewTime = Date.now(); // ✅ อัปเดตเวลาที่ renew ล่าสุด
          console.log("🔄 Token renewed successfully");
          // เรียก renew session cookie ด้วย
          await renewSessionCookie();
        }
      } catch (err) {
        console.error("❌ Failed to renew token:", err);
      }
    };

    const activityDetected = () => {
      clearTimeout(timeoutId);

      const currentToken = localStorage.getItem("token");
      const now = Date.now();

      const enoughTimePassed = now - lastRenewTime > COOLDOWN_MS;
      const tokenIsExpiring = isTokenExpiringSoon(currentToken, 60);

      if (tokenIsExpiring && enoughTimePassed) {
        renewToken(currentToken!);
      }

      timeoutId = setTimeout(() => {
        // allow next renew after cooldown
      }, COOLDOWN_MS);
    };

    window.addEventListener("mousemove", activityDetected);
    window.addEventListener("keydown", activityDetected);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("mousemove", activityDetected);
      window.removeEventListener("keydown", activityDetected);
    };
  }, [token]);

  return (
    <Router>
      <GoogleMapsProvider>
        <div
          className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"
            }`}
        >
          {!token && (
            <Header
              toggleSidebar={toggleSidebar}
              isSidebarOpen={isSidebarOpen}
            />
          )}
          {token && (
            <Sidebar
              isSidebarOpen={isSidebarOpen}
              toggleSidebar={toggleSidebar}
            />
          )}
          <div className="main-content">
            <Routes>
              <Route
                path="/"
                element={
                  token ? <Navigate to="/dashboard" replace /> : <HomePage />
                }
              />
              <Route path="/home" element={<HomePage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forgot-password"
                element={
                  <ForgotPassword />
                }
              />
              <Route
                path="/reset-password"
                element={

                  <ResetPassword />

                }
              />
              <Route
                path="/map"
                element={
                  <ProtectedRoute>
                    <MapView />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicles"
                element={
                  <ProtectedRoute>
                    <VehiclePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/vehicle/:id/view"
                element={
                  <ProtectedRoute>
                    <VehicleTimelinePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/Drivers"
                element={
                  <ProtectedRoute>
                    <Drivers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/drivers/:id" element={
                  <ProtectedRoute>
                    <DriverProfilePage />
                  </ProtectedRoute>} />
              <Route
                path="/containers"
                element={
                  <ProtectedRoute>
                    <ContainerPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/:registration"
                element={
                  <ProtectedRoute>
                    <EventViewerPage />
                  </ProtectedRoute>
                }
              />
              {/* <Route
                path="/track"
                element={
                  <ProtectedRoute>
                    <TrackContainersPage />
                  </ProtectedRoute>
                }
              /> */}
              <Route
                path="/management"
                element={
                  <ProtectedRoute>
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
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportPage />
                  </ProtectedRoute>
                }
              />
            </Routes>

          </div>
        </div>
      </GoogleMapsProvider>
    </Router>
  );
};

export default App;
