// File: src/routes/ProtectedRoute.jsx

import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  const location = useLocation();

  /*
   * Unauthenticated users must sign in before accessing
   * protected application screens.
   */

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  /*
   * If a route specifies allowed roles, verify the current role.
   */

  if (
    allowedRoles &&
    !allowedRoles.includes(user?.role)
  ) {
    return <Navigate to="/access-denied" replace />;
  }

  return <Outlet />;
}