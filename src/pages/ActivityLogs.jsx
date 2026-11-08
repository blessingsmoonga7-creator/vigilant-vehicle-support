// File: src/pages/ActivityLogs.jsx

import { useEffect, useState } from "react";
import { Table, Badge } from "react-bootstrap";
import api from "../services/api";
import { useToast } from "../context/ToastContext";

export default function ActivityLogs() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const res = await api.getAuditLogs();
      if (res.success) {
        setLogs(res.data);
      } else {
        showToast("Failed to load audit logs.", "danger");
      }
      setLoading(false);
    }
    fetchLogs();
    // eslint-disable-next-line
  }, []);

  function formatTime(isoString) {
    if (!isoString) return "—";
    return new Date(isoString).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit"
    });
  }

  function renderActionBadge(action) {
    switch (action) {
      case "LOGIN":
        return <Badge bg="primary">Login</Badge>;
      case "SCAN_SUBMITTED":
        return <Badge bg="info" className="text-dark">Scan Submitted</Badge>;
      case "MATCH_CONFIRMED":
        return <Badge bg="success">Match Confirmed</Badge>;
      case "MATCH_FALSE_ALERT":
        return <Badge bg="danger">False Alert</Badge>;
      case "MATCH_REVIEW_LATER":
        return <Badge bg="secondary">Review Later</Badge>;
      default:
        return <Badge bg="dark">{action}</Badge>;
    }
  }

  function exportToCSV() {
    if (logs.length === 0) return;

    const headers = ["Time", "User", "Action", "Target", "Notes"];
    const rows = logs.map((l) => [
      formatTime(l.timestamp),
      l.username,
      l.action,
      l.target,
      l.notes,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `audit_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="page-heading mb-0">
          <h1>Activity Logs</h1>
          <p>Immutable audit trail of all actions (NFR5).</p>
        </div>
        <button 
          className="btn btn-outline-secondary" 
          onClick={exportToCSV}
          disabled={logs.length === 0 || loading}
        >
          <i className="bi bi-download me-2"></i> Export CSV
        </button>
      </div>

      <div className="surface-card p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status"></div>
            <p className="mt-3 text-muted">Loading audit logs...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Target / Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center text-muted py-4">
                      No activity recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td className="text-nowrap small text-muted">
                        {formatTime(log.timestamp)}
                      </td>
                      <td>
                        <i className="bi bi-person-circle me-2 text-muted"></i>
                        {log.username}
                      </td>
                      <td>{renderActionBadge(log.action)}</td>
                      <td>
                        <div className="fw-semibold">{log.target}</div>
                        {log.notes && <div className="small text-muted">{log.notes}</div>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        )}
      </div>
    </section>
  );
}
