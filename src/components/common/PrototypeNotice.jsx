// File: src/components/common/PrototypeNotice.jsx

export default function PrototypeNotice() {
  return (
    <div
      className="prototype-notice"
      role="note"
      aria-label="Prototype information"
    >
      <i className="bi bi-shield-check" aria-hidden="true" />

      <span>
        Prototype using simulated data. A human must verify every alert.
      </span>
    </div>
  );
}
