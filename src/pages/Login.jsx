// File: src/pages/Login.jsx

import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!username.trim()) errs.username = "Username is required.";
    if (!password) errs.password = "Password is required.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    const result = await login({ username, password });
    if (result.success) {
      navigate(from, { replace: true });
    } else {
      setError(result.message || "Login failed. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8F9FA" }}>
      {/* Left side - Branding / Pattern (hidden on mobile) */}
      <div className="d-none d-lg-flex flex-column justify-content-center align-items-center" style={{ flex: 1, backgroundColor: "#136B00", color: "white", padding: "3rem" }}>
        <i className="bi bi-shield-check mb-4" style={{ fontSize: "5rem", color: "#EF7D00" }}></i>
        <h1 className="fw-bold mb-2">Vigilant</h1>
        <h4 className="mb-4">Vehicle Support System</h4>
        <p className="text-white-50 text-center" style={{ maxWidth: "400px" }}>
          A controlled prototype for authorised vehicle checks. Simulated data only.
          A human must verify every alert.
        </p>
      </div>

      {/* Right side - Login Form */}
      <div className="d-flex flex-column justify-content-center align-items-center w-100" style={{ flex: 1, padding: "2rem" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div className="text-center mb-5 d-lg-none">
            <i className="bi bi-shield-check mb-2" style={{ fontSize: "3rem", color: "#136B00" }}></i>
            <h3 className="fw-bold">Vigilant</h3>
          </div>

          <h2 className="fw-bold mb-2">Welcome back</h2>
          <p className="text-muted mb-4">Please sign in to your account.</p>

          {error && (
            <div className="alert alert-danger py-2" role="alert">
              <i className="bi bi-exclamation-triangle me-2"></i>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                className={`form-control form-control-lg ${fieldErrors.username ? "is-invalid" : ""}`}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoFocus
              />
              {fieldErrors.username && (
                <div className="invalid-feedback">{fieldErrors.username}</div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold" htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-control form-control-lg ${fieldErrors.password ? "is-invalid" : ""}`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ paddingRight: "3rem" }} 
                />
                <button
                  type="button"
                  className="btn btn-link text-muted position-absolute top-50 translate-middle-y end-0"
                  style={{ textDecoration: "none", zIndex: 10 }}
                  onClick={() => setShowPassword((s) => !s)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                </button>
              </div>
              {fieldErrors.password && (
                <div className="invalid-feedback d-block">{fieldErrors.password}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-success btn-lg w-100 fw-bold"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-5 p-3 rounded" style={{ backgroundColor: "#E8F5E9" }}>
            <h6 className="fw-bold text-success mb-2">Demo Accounts (Mock Data)</h6>
            <div className="small mb-1"><strong>Admin:</strong> admin / Admin123!</div>
            <div className="small"><strong>Operator:</strong> operator / Operator123!</div>
          </div>
        </div>
      </div>
    </div>
  );
}
