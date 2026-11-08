// File: src/components/layout/Sidebar.jsx

import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const linkStyle = {
    color: "rgba(255,255,255,0.8)",
    textDecoration: "none",
    padding: "0.75rem 1rem",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    marginBottom: "0.25rem",
    transition: "background 0.2s"
  };

  const activeStyle = {
    ...linkStyle,
    backgroundColor: "rgba(255,255,255,0.15)",
    color: "#ffffff",
    fontWeight: "600"
  };

  return (
    <aside style={{
      backgroundColor: "#136B00",
      color: "#ffffff",
      width: "260px",
      minHeight: "100vh",
      padding: "1.5rem 1rem",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0
    }}>
      <div className="mb-4 px-2">
        <h4 className="fw-bold mb-1 text-white">Vigilant</h4>
        <div className="small text-white-50">Vehicle Support System</div>
      </div>

      <div className="text-white-50 small fw-bold mb-2 mt-2 px-2" style={{ letterSpacing: "1px" }}>WORKSPACE</div>
      
      <NavLink to="/dashboard" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
        <i className="bi bi-grid-1x2"></i> Dashboard
      </NavLink>
      <NavLink to="/vehicle-checks" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
        <i className="bi bi-camera"></i> Vehicle Checks
      </NavLink>
      <NavLink to="/watchlist" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
        <i className="bi bi-shield-exclamation"></i> Vehicle Watchlist
      </NavLink>
      <NavLink to="/activity-logs" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
        <i className="bi bi-clock-history"></i> Activity Logs
      </NavLink>

      <div className="text-white-50 small fw-bold mb-2 mt-4 px-2" style={{ letterSpacing: "1px" }}>SYSTEM</div>
      
      <NavLink to="/evaluation" style={({ isActive }) => isActive ? activeStyle : linkStyle}>
        <i className="bi bi-graph-up-arrow"></i> Evaluation
      </NavLink>

      <div style={{ marginTop: "auto", backgroundColor: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px" }}>
        <div className="fw-bold text-white small mb-1">
          <i className="bi bi-shield-check me-2"></i>Prototype Environment
        </div>
        <div className="text-white-50" style={{ fontSize: "0.75rem" }}>
          Simulated records only. Human verification required.
        </div>
      </div>
    </aside>
  );
}
