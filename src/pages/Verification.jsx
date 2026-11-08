// File: src/pages/Verification.jsx

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Modal, Button, Form } from "react-bootstrap";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

function formatMs(ms) { return ms ? `${(ms / 1000).toFixed(2)} s` : "—"; }

export default function Verification() {
  const { checkId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [check, setCheck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [decision, setDecision] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchCheck() {
      setLoading(true);
      const res = await api.getVehicleCheck(checkId);
      if (res.success) setCheck(res.data);
      else setError(res.message);
      setLoading(false);
    }
    fetchCheck();
  }, [checkId]);

  function openActionModal(selectedDecision) {
    setDecision(selectedDecision);
    setNotes("");
    setShowModal(true);
  }

  async function handleReviewSubmit() {
    setSubmitting(true);
    const res = await api.reviewMatch({ checkId, plate: check.matchedVehicle?.plate, decision, notes, username: user?.username || "operator" });
    if (res.success) {
      showToast("Review recorded successfully.", "success");
      navigate("/dashboard");
    } else {
      showToast(res.message, "danger");
      setSubmitting(false);
      setShowModal(false);
    }
  }

  if (loading) return <section className="p-5 text-center"><div className="spinner-border text-success"></div></section>;
  if (error || !check) return <section><div className="surface-card text-center p-4"><i className="bi bi-x-circle text-danger fs-1"></i><h2 className="h4 mt-3">Check not found</h2><Link to="/vehicle-checks" className="btn btn-success mt-3">Start a new check</Link></div></section>;

  const isMatch = check.status === "possible_match";
  const vehicle = check.matchedVehicle;

  return (
    <section>
      <div className="page-heading mb-4">
        <div className="d-flex align-items-center gap-3">
          <h1>Verification</h1>
          <span className={`badge ${isMatch ? "bg-warning text-dark" : "bg-success"}`}>{isMatch ? "Possible Match" : "No Match"}</span>
        </div>
        <p>Review the details below and make a human decision.</p>
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="surface-card h-100">
            <h5 className="mb-3">Uploaded Image</h5>
            <div style={{ background: "#f8f9fa", border: "1px dashed #ccc", borderRadius: "8px", overflow: "hidden", display: "flex", justifyContent: "center", alignItems: "center", minHeight: "250px" }}>
              {check.imageUrl ? (
                <img src={check.imageUrl} alt="Uploaded Vehicle" style={{ maxWidth: "100%", maxHeight: "400px", objectFit: "contain" }} />
              ) : (
                <div className="text-center text-muted"><i className="bi bi-camera fs-1 mb-2"></i><br/>Image not available</div>
              )}
            </div>

            <hr className="my-4" />
            <h6>Detection Details (Simulated AI)</h6>
            <ul className="list-unstyled mt-3 mb-0">
              <li className="mb-2 d-flex justify-content-between border-bottom pb-2"><span className="text-muted">Detected Plate:</span><strong className="font-monospace fs-5">{check.detectedPlate}</strong></li>
              <li className="mb-2 d-flex justify-content-between border-bottom pb-2"><span className="text-muted">OCR Confidence:</span><span className="fw-bold text-success">{(check.ocrConfidence * 100).toFixed(1)}%</span></li>
              <li className="mb-2 d-flex justify-content-between border-bottom pb-2"><span className="text-muted">Processing Time:</span><span>{formatMs(check.processingTimeMs)}</span></li>
            </ul>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="surface-card h-100">
            <h5 className="mb-3">Database Result</h5>
            {!isMatch || !vehicle ? (
              <div className="text-center py-5"><i className="bi bi-shield-check text-success fs-1 mb-3"></i><h6>No Match Found</h6><p className="text-muted small mb-0">This plate does not exist in the simulated watchlist.</p></div>
            ) : (
              <>
                <div className="alert alert-warning border-warning d-flex align-items-center gap-2 mb-4"><i className="bi bi-exclamation-triangle-fill"></i>This plate matches a vehicle in the simulated watchlist.</div>
                <h6>Matched Vehicle Record</h6>
                <ul className="list-unstyled mt-3 mb-4">
                  <li className="mb-2 d-flex justify-content-between border-bottom pb-2"><span className="text-muted">Plate:</span><strong className="font-monospace">{vehicle.plate}</strong></li>
                  <li className="mb-2 d-flex justify-content-between border-bottom pb-2"><span className="text-muted">Make & Model:</span><span>{vehicle.make} {vehicle.model}</span></li>
                  <li className="mb-2 d-flex justify-content-between border-bottom pb-2"><span className="text-muted">Colour:</span><span>{vehicle.colour}</span></li>
                  <li className="mb-2 d-flex justify-content-between border-bottom pb-2"><span className="text-muted">Year:</span><span>{vehicle.year}</span></li>
                  <li className="mb-2 d-flex justify-content-between"><span className="text-muted">Status:</span><span className="text-warning fw-bold">Pending Human Review</span></li>
                </ul>
                <h6 className="mt-4">Authorised Decision</h6>
                <div className="d-grid gap-2 mt-3">
                  <button className="btn btn-success" onClick={() => openActionModal("confirm")}><i className="bi bi-check-circle me-2"></i> Confirm Match</button>
                  <button className="btn btn-outline-danger" onClick={() => openActionModal("false_alert")}><i className="bi bi-x-circle me-2"></i> False Alert</button>
                  <button className="btn btn-outline-secondary" onClick={() => openActionModal("review_later")}><i className="bi bi-clock-history me-2"></i> Review Later</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal show={showModal} onHide={() => !submitting && setShowModal(false)} centered>
        <Modal.Header closeButton={!submitting}><Modal.Title>Confirm Decision</Modal.Title></Modal.Header>
        <Modal.Body>
          <p className="text-muted small">This action will be recorded under your username ({user?.username}).</p>
          <Form.Group><Form.Label>Notes (Optional)</Form.Label><Form.Control as="textarea" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} disabled={submitting} /></Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
          <Button variant="success" onClick={handleReviewSubmit} disabled={submitting}>{submitting ? "Saving..." : "Confirm Decision"}</Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
