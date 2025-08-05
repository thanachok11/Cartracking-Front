import axios from "axios";
import React, { useState, useEffect } from "react";
import Header from "./components/layout/Header";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VehicleTimelinePage from "./pages/VehicleTimeline";
import MapView from "./pages/MapView";
import HomePage from "./components/landingPage/LandingPage";
import Sidebar from "./components/layout/Sidebar";
import { GoogleMapsProvider } from './pages/GoogleMapsProvider';
import Drivers from "./pages/DriverPage";
import VehiclePage from "./pages/VehiclePage";
import ContainerPage from "./pages/ContainerPage";
import TrackContainer from "./pages/TrackContainer";

import "./App.css";
import { jwtDecode } from "jwt-decode";
// Interceptor เดิมของคุณ
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // localStorage.removeItem("token");
      // window.location.href = "/";
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
        await axios.post(`${API_BASE_URL}/renewCookie`, {}, { withCredentials: true });
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

      const token = localStorage.getItem("token");
      const now = Date.now();

      const enoughTimePassed = now - lastRenewTime > COOLDOWN_MS;
      const tokenIsExpiring = isTokenExpiringSoon(token, 60);

      if (tokenIsExpiring && enoughTimePassed) {
        renewToken(token!);
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
  }, []);


  return (
    <Router>
      <GoogleMapsProvider>
        <div className={`app-container ${isSidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
          {!token && (
            <Header toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
          )}
          {token && (
            <Sidebar isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
          )}
          <div className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/vehicles" element={<VehiclePage />} />
              <Route path="/vehicle/:id/view" element={<VehicleTimelinePage />} />
              <Route path="/Drivers" element={<Drivers />} />
              <Route path="/containers" element={<ContainerPage />} />
              <Route path="/track" element={<TrackContainer />} />
            </Routes>
          </div>
        </div>
      </GoogleMapsProvider>
    </Router>
  );
};

export default App;
