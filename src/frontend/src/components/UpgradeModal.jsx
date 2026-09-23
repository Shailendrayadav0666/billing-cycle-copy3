export default function UpgradeModal({ open, remainingDays, charge, isSubmitting, onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="modal-overlay">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        <h3 id="upgrade-modal-title" className="modal-title">
          Upgrade to Premium
        </h3>
        <p className="modal-body">
          Premium is $40/month. You&apos;ll be charged a prorated amount for the rest of this cycle.
        </p>

        <div className="modal-info-box">
          <div className="modal-info-row">
            <span>Remaining days</span>
            <span>{remainingDays} days</span>
          </div>
          <div className="modal-info-row">
            <span>Charge today</span>
            <span className="modal-info-value">{charge}</span>
          </div>
        </div>

        <ul className="modal-benefits">
          <li>Stream on 4 devices at once</li>
          <li>Download on 4 devices</li>
          <li>4K + HDR video quality</li>
        </ul>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={isSubmitting}
            data-testid="upgrade-modal-confirm-button"
          >
            Confirm & pay {charge}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
            data-testid="upgrade-modal-cancel-button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
