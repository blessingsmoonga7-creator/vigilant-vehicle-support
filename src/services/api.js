// File: src/services/api.js

import axios from "axios";

const MOCK_DELAY_MS = 650;
const DEMO_USERS = [
  { id: 1, username: "admin", password: "Admin123!", fullName: "System Administrator", role: "Administrator", active: true },
  { id: 2, username: "operator", password: "Operator123!", fullName: "Authorised Operator", role: "Authorised Operator", active: true },
];

const simulatedChecks = new Map();

function waitForMockResponse() { return new Promise((r) => setTimeout(r, MOCK_DELAY_MS)); }
function createResponse(success, data = null, message = "") { return { success, data, message }; }
function toPublicUser(user) { return { id: user.id, username: user.username, fullName: user.fullName, role: user.role }; }

async function login(credentials) {
  await waitForMockResponse();
  const user = DEMO_USERS.find((u) => u.username === credentials.username.trim() && u.password === credentials.password && u.active);
  if (!user) return createResponse(false, null, "Incorrect username or password.");
  return createResponse(true, { user: toPublicUser(user), accessToken: `mock-token-${user.id}` }, "Login successful.");
}

async function logout() { await waitForMockResponse(); return createResponse(true, null, "Logged out."); }

async function getDashboard() {
  await waitForMockResponse();
  const logs = await getAuditLogs();
  const confirmed = logs.data.filter(l => l.action === "MATCH_CONFIRMED").length;
  const falseAlerts = logs.data.filter(l => l.action === "MATCH_FALSE_ALERT").length;
  const scans = logs.data.filter(l => l.action === "SCAN").length;
  return createResponse(true, { scansToday: scans, possibleMatches: confirmed + falseAlerts, confirmed, falseAlerts, averageResponseTimeMs: 1900, recentActivity: logs.data.slice(0, 5) }, "Dashboard loaded.");
}

async function getVehicleRecords() {
  try {
    const res = await axios.get("http://127.0.0.1:8000/api/watchlist");
    return res.data;
  } catch { return createResponse(false, null, "Failed to load watchlist."); }
}

async function addVehicle(vehicleData) {
  try {
    const res = await axios.post("http://127.0.0.1:8000/api/watchlist", {
      plate: vehicleData.plate,
      make: vehicleData.make,
      model: vehicleData.model,
      colour: vehicleData.colour,
      year: parseInt(vehicleData.year, 10)
    });
    return res.data;
  } catch (err) { return createResponse(false, null, err.response?.data?.detail || "Failed to add vehicle."); }
}

async function getAuditLogs() {
  try { const res = await axios.get("http://127.0.0.1:8000/api/audit-logs"); return res.data; }
  catch { return createResponse(true, [], "No logs."); }
}

async function getEvaluationMetrics() {
  await waitForMockResponse();
  return createResponse(true, { plateDetectionAccuracy: 0.87, recognitionAccuracy: 0.81, falsePositiveRate: 0.06, falseNegativeRate: 0.09, avgResponseTimeSec: 1.9, byLighting: [{ label: "Daylight", value: 0.91 }, { label: "Low light", value: 0.72 }, { label: "Night", value: null }], byDistance: [{ label: "Near (<5m)", value: 0.94 }, { label: "Medium (5-10m)", value: 0.83 }, { label: "Far (>10m)", value: null }], byAngle: [{ label: "Front", value: 0.90 }, { label: "Slight", value: 0.79 }, { label: "Oblique", value: null }] }, "Metrics loaded.");
}

async function submitVehicleCheck(payload = {}) {
  if (payload.imageFile) {
    try {
      const formData = new FormData();
      formData.append("file", payload.imageFile, payload.imageFile.name);
      const response = await axios.post("http://127.0.0.1:8000/api/scan", formData, { headers: { "Content-Type": "multipart/form-data" } });
      const result = response.data;
      simulatedChecks.set(result.data.checkId, result.data);
      return result;
    } catch { return createResponse(false, null, "Failed to connect to AI backend."); }
  }
  return createResponse(false, null, "No image provided.");
}

async function getVehicleCheck(checkId) {
  await waitForMockResponse();
  const stored = simulatedChecks.get(checkId);
  if (!stored) return createResponse(false, null, "Check not found.");
  return createResponse(true, stored, "Check loaded.");
}

async function getVehicleChecks() {
  await waitForMockResponse();
  return createResponse(true, Array.from(simulatedChecks.values()), "Checks loaded.");
}

async function reviewMatch(payload = {}) {
  try {
    const res = await axios.post("http://127.0.0.1:8000/api/review", {
      checkId: payload.checkId, plate: payload.plate, decision: payload.decision, notes: payload.notes, username: payload.username
    });
    return res.data;
  } catch { return createResponse(false, null, "Failed to save review."); }
}

const apiClient = axios.create({ timeout: 10000, headers: { "Content-Type": "application/json" } });
const api = { login, logout, getDashboard, getVehicleRecords, addVehicle, getAuditLogs, submitVehicleCheck, reviewMatch, getVehicleCheck, getVehicleChecks, getEvaluationMetrics };

export { apiClient };
export default api;
