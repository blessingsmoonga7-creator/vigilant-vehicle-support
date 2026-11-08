// File: src/pages/Dashboard.jsx

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

/*
 * Small helper: turn milliseconds into a short human string.
 * Example: 1900 -> "1.9 s"
 */
function formatMs(ms) {
  if (ms === null || ms === undefined) {
    return "—";
  }

  return `${(ms / 1000).toFixed(1)} s`;
}

/*
 * Map an audit action code to a Bootstrap Icon class and a
 * short, plain-English label for the Recent Activity list.
 */
function describeAction(action) {
  switch (action) {
    case "LOGIN":
      return { icon: "bi-box-arrow-in-right", label: "Signed in" };
    case "SCAN_SUBMITTED":
      return { icon: "bi-camera", label: "Scan submitted" };
    case "MATCH_CONFIRMED":
      return { icon: "bi-check2-circle", label: "Match confirmed" };
    case "MATCH_FALSE_ALERT":
      return { icon: "bi-x-circle", label: "Marked false alert" };
    case "MATCH_REVIEW_LATER":
      return { icon: "bi-clock-history", label: "Review later" };
    default:
      return { icon: "bi-dot", label: action || "Activity" };
  }
}

/*
 * Turn an ISO timestamp into a short local time string.
 */
function formatTime(isoString) {
  if (!isoString) {
    return "—";
  }

  const date = new Date(isoString);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const { user } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Fetch the dashboard data from the mock API.
   *
   * useCallback keeps the function identity stable so that
   * useEffect only runs it once (and again when the user
   * clicks Retry).
   */
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.getDashboard();

      if (!response.success) {
        setError(response.message || "Could not load the dashboard.");
        setStats(null);
        return;
      }

      setStats(response.data);
    } catch {
      setError("Could not load the dashboard. Please try again.");
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  /*
   * The five stat cards, built once and reused in the grid.
   * Values come straight from the mock API response.
   */
  const cards = stats
    ? [
        {
          key: "scans",
          label: "Scans Today",
          value: stats.scansToday,
          icon: "bi-camera",
          tone: "neutral",
        },
        {
          key: "possible",
          label: "Possible Matches",
          value: stats.possibleMatches,
          icon: "bi-exclamation-triangle",
          tone: "warning",
        },
        {
          key: "confirmed",
          label: "Confirmed",
          value: stats.confirmed,
          icon: "bi-check2-circle",
          tone: "success",
        },
        {
          key: "false",
          label: "False Alerts",
          value: stats.falseAlerts,
          icon: "bi-x-circle",
          tone: "danger",
        },
        {
          key: "response",
          label: "Avg Response Time",
          value: formatMs(stats.averageResponseTimeMs),
          icon: "bi-stopwatch",
          tone: "neutral",
        },
      ]
    : [];

  return (
    <section>
      <div className="page-heading">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.fullName}.</p>
      </div>

      {/* Prototype safety notice — visible only on this page. */}

      <div
        className="surface-card mb-3"
        style={{
          borderLeft: "4px solid var(--bs-warning, #f0ad4e)",
          fontSize: "0.9rem",
        }}
      >
        <i className="bi bi-info-circle me-2" aria-hidden="true" />
        Simulated data. A human must verify every alert. A plate
        match is never proof that a vehicle is stolen.
      </div>

      {/* Error state */}

      {error && (
        <div className="surface-card mb-3" role="alert">
          <div className="d-flex align-items-center gap-3">
            <i
              className="bi bi-exclamation-octagon"
              style={{ fontSize: "1.5rem", color: "#dc3545" }}
              aria-hidden="true"
            />
            <div className="flex-grow-1">
              <strong>Unable to load the dashboard.</strong>
              <div className="small">{error}</div>
            </div>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={loadDashboard}
            >
              <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}

      {loading && (
        <div className="row g-3 mb-3" aria-label="Loading dashboard">
          {[0, 1, 2, 3, 4].map((i) => (
            <div className="col-12 col-sm-6 col-lg-4 col-xl" key={i}>
              <div className="surface-card" style={{ minHeight: "100px" }}>
                <div
                  className="placeholder-glow"
                  style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
                >
                  <span className="placeholder col-5" />
                  <span className="placeholder col-7" style={{ height: "1.8rem" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filled stat cards */}

      {!loading && stats && (
        <div className="row g-3 mb-4">
          {cards.map((card) => {
            const toneColour = {
              neutral: "#495057",
              warning: "#f0ad4e",
              success: "#198754",
              danger: "#dc3545",
            }[card.tone];

            return (
              <div className="col-12 col-sm-6 col-lg-4 col-xl" key={card.key}>
                <div className="surface-card h-100">
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <i
                      className={`bi ${card.icon}`}
                      style={{ color: toneColour, fontSize: "1.2rem" }}
                      aria-hidden="true"
                    />
                    <span className="text-muted small">{card.label}</span>
                  </div>
                  <div className="h3 mb-0" style={{ color: toneColour }}>
                    {card.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recent activity */}

      {!loading && stats && (
        <div className="surface-card">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <h2 className="h5 mb-0">Recent Activity</h2>
            <span className="text-muted small">
              <i className="bi bi-shield-lock me-1" aria-hidden="true" />
              Simulated log
            </span>
          </div>

          {stats.recentActivity.length === 0 ? (
            <div className="text-center text-muted py-4">
              <i className="bi bi-inbox fs-3 d-block mb-2" aria-hidden="true" />
              No activity yet. Submit a vehicle check to see it here.
            </div>
          ) : (
            <ul className="list-unstyled mb-0">
              {stats.recentActivity.map((entry, index) => {
                const info = describeAction(entry.action);

                return (
                  <li
                    key={entry.id || `${entry.action}-${index}`}
                    className="d-flex align-items-start gap-3 py-2"
                    style={{
                      borderTop:
                        index === 0 ? "none" : "1px solid rgba(0,0,0,0.06)",
                    }}
                  >
                    <i
                      className={`bi ${info.icon}`}
                      style={{ fontSize: "1.1rem", color: "#198754" }}
                      aria-hidden="true"
                    />
                    <div className="flex-grow-1">
                      <div>
                        <strong>{info.label}</strong>
                        {entry.target && entry.target !== "-" && (
                          <span className="text-muted">
                            {" "}
                            — {entry.target}
                          </span>
                        )}
                      </div>
                      <div className="text-muted small">
                        {entry.username}
                        {" • "}
                        {formatTime(entry.timestamp)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}