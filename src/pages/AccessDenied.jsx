// File: src/pages/AccessDenied.jsx

import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function AccessDenied() {
  const { user } = useAuth();

  const homePath =
    user?.role === "Administrator" ||
    user?.role === "Authorised Operator"
      ? "/dashboard"
      : "/login";

  return (
    <div className="access-denied-page">
      <div className="access-denied-card">
        <div className="access-denied-icon">
          <i
            className="bi bi-shield-lock"
            aria-hidden="true"
          />
        </div>

        <span className="access-denied-code">
          ACCESS RESTRICTED
        </span>

        <h1>Access denied</h1>

        <p>
          Your current account does not have permission to
          access this page.
        </p>

        <Link to={homePath} className="btn brand-button">
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}