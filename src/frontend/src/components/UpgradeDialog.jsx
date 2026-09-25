import { useEffect, useRef } from 'react'

const PREMIUM_BENEFITS = [
  '4K Ultra HD video quality',
  'Stream on 4 devices at once',
  'Download on 6 devices',
  'Dolby Vision (select titles)',
]

export default function UpgradeDialog({ currentPlan, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  function handleKeyDown(event) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
    }
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="upgrade-overlay" onClick={handleBackdropClick} data-testid="upgrade-backdrop">
      <div
        ref={dialogRef}
        className="upgrade-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-dialog-title"
        tabIndex={-1}
        onKeyDown={handleKeyDown}
      >
        <h3 id="upgrade-dialog-title" className="upgrade-dialog-title">
          Upgrade to Premium
        </h3>
        <p className="upgrade-dialog-text">
          Premium is $40/month. You&apos;ll be charged a prorated amount for the rest of this cycle.
        </p>

        <dl className="upgrade-summary">
          <div className="upgrade-summary-row">
            <dt>Current plan</dt>
            <dd>{currentPlan}</dd>
          </div>
          <div className="upgrade-summary-row">
            <dt>New plan</dt>
            <dd>Premium ($40/mo)</dd>
          </div>
        </dl>

        <ul className="upgrade-benefits">
          {PREMIUM_BENEFITS.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>

        <div className="upgrade-actions">
          <button type="button" className="upgrade-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
