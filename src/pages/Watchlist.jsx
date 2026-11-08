// File: src/pages/Watchlist.jsx

import { useEffect, useState } from "react";
import { Modal, Button, Form, Table, Badge } from "react-bootstrap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function Watchlist() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ plate: "", make: "", model: "", colour: "", year: "" });

  if (user?.role !== "Administrator") {
    return <div className="alert alert-danger mt-4"><i className="bi bi-shield-lock me-2"></i>Access Denied.</div>;
  }

  async function loadVehicles() {
    setLoading(true);
    const res = await api.getVehicleRecords();
    if (res.success) setVehicles(res.data);
    else showToast("Failed to load records.", "danger");
    setLoading(false);
  }

  useEffect(() => { loadVehicles(); }, []);

  const filtered = vehicles.filter((v) => {
    const t = search.toLowerCase();
    return v.plate.toLowerCase().includes(t) || v.make.toLowerCase().includes(t) || v.model.toLowerCase().includes(t);
  });

  function handleFormChange(e) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    
    const res = await api.addVehicle(formData);
    
    if (res.success) {
      showToast(`Added ${formData.plate} to database!`, "success");
      setShowModal(false);
      setFormData({ plate: "", make: "", model: "", colour: "", year: "" });
      loadVehicles(); // Reload from DB
    } else {
      showToast(res.message, "danger");
    }
    setSaving(false);
  }

  return (
    <section>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="page-heading mb-0">
          <h1>Vehicle Watchlist</h1>
          <p>Manage the simulated database of vehicles of interest.</p>
        </div>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          <i className="bi bi-plus-lg me-2"></i> Add Vehicle
        </button>
      </div>

      <div className="surface-card p-4">
        <div className="mb-3" style={{ maxWidth: "300px" }}>
          <input type="text" className="form-control" placeholder="Search by plate, make..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {loading ? <div className="text-center py-5"><div className="spinner-border text-success"></div></div> : (
          <Table hover className="align-middle mb-0">
            <thead className="table-light">
              <tr><th>Plate</th><th>Make & Model</th><th>Colour</th><th>Year</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan="5" className="text-center text-muted py-4">No vehicles found.</td></tr> : 
                filtered.map((v) => (
                  <tr key={v.id}>
                    <td className="fw-bold font-monospace">{v.plate}</td>
                    <td>{v.make} {v.model}</td>
                    <td>{v.colour}</td>
                    <td>{v.year}</td>
                    <td><Badge bg="success">{v.status}</Badge></td>
                  </tr>
                ))
              }
            </tbody>
          </Table>
        )}
      </div>

      <Modal show={showModal} onHide={() => !saving && setShowModal(false)} centered>
        <Modal.Header closeButton={!saving}><Modal.Title>Add Vehicle</Modal.Title></Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Number Plate</Form.Label>
              <Form.Control type="text" name="plate" value={formData.plate} onChange={handleFormChange} required />
            </Form.Group>
            <div className="row g-3 mb-3">
              <div className="col-md-6"><Form.Group><Form.Label>Make</Form.Label><Form.Control type="text" name="make" value={formData.make} onChange={handleFormChange} required /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Model</Form.Label><Form.Control type="text" name="model" value={formData.model} onChange={handleFormChange} required /></Form.Group></div>
            </div>
            <div className="row g-3">
              <div className="col-md-6"><Form.Group><Form.Label>Colour</Form.Label><Form.Control type="text" name="colour" value={formData.colour} onChange={handleFormChange} required /></Form.Group></div>
              <div className="col-md-6"><Form.Group><Form.Label>Year</Form.Label><Form.Control type="number" name="year" value={formData.year} onChange={handleFormChange} required /></Form.Group></div>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>Cancel</Button>
            <Button variant="success" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Vehicle"}</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </section>
  );
}
