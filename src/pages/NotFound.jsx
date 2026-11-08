// File: src/pages/NotFound.jsx

import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function NotFound() {
  const { isAuthenticated } = useAuth();

  const destination = isAuthenticated ? "/dashboard" : "/login";

  return (
    <main className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-code">404</span>

        <h1>Page not found</h1>

        <p>
          The page you are looking for does not exist
          or may have moved.
        </p>

        <Link to={destination} className="btn brand-button">
          Return to safety
        </Link>
      </div>
    </main>
  );
}