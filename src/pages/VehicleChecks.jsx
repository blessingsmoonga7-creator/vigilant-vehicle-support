// File: src/pages/VehicleChecks.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function VehicleChecks() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [manualPlate, setManualPlate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function validateAndSetFile(file) {
    setError("");
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a JPEG, PNG, or WEBP image. Other file types are not supported.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`That image is ${formatFileSize(file.size)}. Please choose a file under 5 MB.`);
      return;
    }
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  }

  function handleFileInputChange(event) {
    const file = event.target.files?.[0];
    if (file) validateAndSetFile(file);
    event.target.value = "";
  }

  function handleDragOver(event) {
    event.preventDefault();
    setDragOver(true);
  }
  function handleDragLeave(event) {
    event.preventDefault();
    setDragOver(false);
  }
  function handleDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) validateAndSetFile(file);
  }

  function handleRemoveImage() {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    setImageFile(null);
    setImagePreviewUrl("");
  }

  async function handleScan(event) {
    event.preventDefault();
    setError("");
    
    if (!imageFile && !manualPlate.trim()) {
      setError("Please choose an image or enter a plate number.");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const response = await api.submitVehicleCheck({
        plateText: manualPlate.trim() || undefined,
        imageFile: imageFile, // 👈 THIS IS THE CRITICAL FIX
        imageFileName: imageFile?.name,
        username: user?.username || "operator",
      });

      if (!response.success) {
        setError(response.message || "The scan could not be completed.");
        return;
      }

      navigate(`/verification/${response.data.checkId}`, {
        state: { check: response.data },
      });
    } catch {
      setError("Something went wrong while submitting the scan.");
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = (imageFile || manualPlate.trim().length > 0) && !submitting;

  return (
    <section>
      <div className="page-heading">
        <h1>Vehicle Checks</h1>
        <p>Upload a vehicle image. The system will read the number plate and compare it against the simulated watchlist.</p>
      </div>

      <div className="surface-card mb-3" style={{ borderLeft: "4px solid var(--bs-warning, #f0ad4e)", fontSize: "0.9rem" }}>
        <i className="bi bi-info-circle me-2" aria-hidden="true" />
        Prototype using simulated data. A possible match is never proof that a vehicle is stolen. A human operator must verify every result.
      </div>

      {error && (
        <div className="surface-card mb-3" role="alert">
          <div className="d-flex align-items-center gap-3">
            <i className="bi bi-exclamation-octagon" style={{ fontSize: "1.5rem", color: "#dc3545" }} aria-hidden="true" />
            <div className="flex-grow-1">
              <strong>Cannot continue.</strong>
              <div className="small">{error}</div>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleScan}>
        <div className="surface-card mb-3">
          <label
            htmlFor="image-input"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              display: "block",
              cursor: submitting ? "not-allowed" : "pointer",
              border: `2px dashed ${dragOver ? "#198754" : "rgba(0,0,0,0.15)"}`,
              borderRadius: "12px",
              padding: "2rem 1rem",
              textAlign: "center",
              background: dragOver ? "rgba(25,135,84,0.06)" : "transparent",
              transition: "border-color 0.15s ease, background 0.15s ease",
            }}
          >
            <input
              id="image-input"
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileInputChange}
              disabled={submitting}
              style={{ display: "none" }}
            />

            {!imagePreviewUrl ? (
              <>
                <i className="bi bi-cloud-arrow-up" style={{ fontSize: "2.5rem", color: "#198754" }} aria-hidden="true" />
                <div className="mt-2 fw-semibold">Drag and drop an image here, or click to browse</div>
                <div className="text-muted small mt-1">JPEG, PNG, or WEBP. Maximum 5 MB.</div>
              </>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem" }}>
                <img
                  src={imagePreviewUrl}
                  alt="Vehicle preview"
                  style={{ maxHeight: "240px", maxWidth: "100%", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                />
                <div className="small">
                  <strong>{imageFile.name}</strong>{" • "}{formatFileSize(imageFile.size)}
                </div>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={(e) => { e.preventDefault(); handleRemoveImage(); }}
                  disabled={submitting}
                >
                  <i className="bi bi-x-circle me-1" aria-hidden="true" />
                  Remove image
                </button>
              </div>
            )}
          </label>
        </div>

        <div className="surface-card mb-3">
          <label htmlFor="manual-plate" className="form-label">
            Or enter a plate number manually <span className="text-muted small">(for testing)</span>
          </label>
          <input
            id="manual-plate"
            type="text"
            className="form-control"
            placeholder="e.g. AAX 1001"
            value={manualPlate}
            onChange={(e) => setManualPlate(e.target.value)}
            disabled={submitting}
          />
          <div className="form-text">
            If provided, the system will use this plate instead of the one it would have read from the image.
          </div>
        </div>

        <div className="d-flex align-items-center justify-content-between">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => { handleRemoveImage(); setManualPlate(""); setError(""); }}
            disabled={submitting}
          >
            <i className="bi bi-arrow-counterclockwise me-1" aria-hidden="true" />
            Reset
          </button>

          <button type="submit" className="btn btn-success" disabled={!canSubmit} style={{ minWidth: "160px" }}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Scanning…
              </>
            ) : (
              <>
                <i className="bi bi-search me-2" aria-hidden="true" />
                Scan image
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
