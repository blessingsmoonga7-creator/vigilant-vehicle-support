// File: src/routes/AppRouter.jsx

import { Navigate, Route, Routes } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import VehicleChecks from "../pages/VehicleChecks";
import Verification from "../pages/Verification";
import Watchlist from "../pages/Watchlist";
import ActivityLogs from "../pages/ActivityLogs";
import Evaluation from "../pages/Evaluation";
import AccessDenied from "../pages/AccessDenied";
import NotFound from "../pages/NotFound";

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/access-denied" element={<AccessDenied />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vehicle-checks" element={<VehicleChecks />} />
          <Route path="/verification/:checkId" element={<Verification />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/activity-logs" element={<ActivityLogs />} />
          <Route path="/evaluation" element={<Evaluation />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
