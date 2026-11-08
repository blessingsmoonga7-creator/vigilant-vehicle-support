// File: src/components/layout/Topbar.jsx

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);

  // Check local storage on load
  useEffect(() => {
    const savedTheme = localStorage.getItem("vigilant-theme");
    if (savedTheme === "dark") {
      setIsDark(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (newTheme) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("vigilant-theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("vigilant-theme", "light");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header style={{
      backgroundColor: "var(--bg-surface, #ffffff)",
      color: "var(--text-main, #111111)",
      borderBottom: "1px solid var(--border-color, #E9ECEF)",
      padding: "1rem 2rem",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      transition: "background-color 0.3s, color 0.3s"
    }}>
      <div>
        <div className="fw-bold" style={{ letterSpacing: "1px", color: "#136B00" }}>VIGILANT</div>
        <div className="text-muted small" style={{ color: "var(--text-muted, #6c757d)" }}>Vehicle Support System</div>
      </div>

      <div className="d-flex align-items-center gap-3">
        <button
          onClick={toggleTheme}
          className="btn btn-outline-secondary btn-sm rounded-circle"
          style={{ width: "40px", height: "40px" }}
          title="Toggle Theme"
        >
          <i className={`bi ${isDark ? "bi-sun" : "bi-moon-stars"}`}></i>
        </button>

        <div className="d-flex align-items-center gap-2 border-start ps-3" style={{ borderColor: "var(--border-color, #E9ECEF)" }}>
          <div
            style={{
              width: "40px", height: "40px", borderRadius: "50%",
              backgroundColor: "#E8F5E9", color: "#136B00",
              display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold",
            }}
          >
            {user?.fullName ? user.fullName.charAt(0) : "VS"}
          </div>
          <div className="d-none d-md-block">
            <div className="fw-bold small" style={{ color: "var(--text-main, #111111)" }}>{user?.fullName || "Demo User"}</div>
            <div className="text-muted" style={{ fontSize: "0.75rem" }}>{user?.role || "Prototype Session"}</div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn btn-outline-secondary btn-sm ms-2">
          <i className="bi bi-box-arrow-right me-1"></i> Sign out
        </button>
      </div>
    </header>
  );
}
