import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import '../App.css'

function InfoIcon() {
  return (
    <svg
      className="info-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

function UsageIcon({ id }) {
  const iconStyle = { width: 18, height: 18, color: '#475569' }
  if (id === 'chat-credits') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    )
  }
  if (id === 'chatbots') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="8" cy="7" r="1" />
        <circle cx="16" cy="7" r="1" />
        <path d="M12 11v10" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}

function IncludedUsageCard({ data }) {
  return (
    <div className="extra-card">
      <div className="extra-title">
        {data.title} <InfoIcon />
      </div>
      {data.items.map((item) => (
        <div key={item.id} className="extra-row">
          <div className="extra-row-header">
            <span>{item.label}</span>
            <span>{item.used_percent}% used</span>
          </div>
          <div className="usage-bar">
            <div
              className="usage-bar-fill"
              style={{ width: `${Math.min(100, item.used_percent)}%` }}
            />
          </div>
          <div className="extra-row-footer">Resets in {item.resets_in}</div>
        </div>
      ))}
    </div>
  )
}

function OnDemandUsageCard({ data }) {
  return (
    <div className="extra-card">
      <div className="extra-title">
        {data.title} <InfoIcon />
      </div>
      <div className="extra-row-space">
        <span className="extra-mute">Remaining balance</span>
        <span className={`extra-value ${data.remaining_balance.startsWith('-') ? 'negative' : ''}`}>
          {data.remaining_balance}
        </span>
      </div>
      <div className="extra-row-space">
        <span className="extra-mute">
          Your on-demand usage <InfoIcon />
        </span>
        <span className="extra-value">{data.your_usage}</span>
      </div>
      <p className="extra-notice">{data.notice}</p>
    </div>
  )
}

function UpgradeModal({ preview, loading, error, onConfirm, onCancel, confirming }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-panel">
        <h3 className="modal-title">Upgrade to Premium</h3>
        {loading && <p>Loading upgrade preview...</p>}
        {!loading && preview && (
          <div className="modal-body">
            <div className="modal-row">
              <span>Current plan</span>
              <span>{preview.current_plan} (${PLAN_PRICES.Standard}/mo)</span>
            </div>
            <div className="modal-row">
              <span>New plan</span>
              <span>{preview.new_plan} (${PLAN_PRICES.Premium}/mo)</span>
            </div>
            <div className="modal-row">
              <span>Days remaining</span>
              <span>{preview.days_remaining}</span>
            </div>
            <p className="modal-charge">
              You will be charged <strong>${preview.prorated_charge.toFixed(2)}</strong> today
            </p>
            <p className="modal-renewal">
              ${preview.next_renewal_price.toFixed(2)}/month starting {preview.renew_at}
            </p>
          </div>
        )}
        {error && <p className="error-text">{error}</p>}
        <div className="modal-actions">
          <button
            type="button"
            className="btn"
            data-testid="billing-upgrade-confirm-button"
            disabled={loading || confirming || !preview}
            onClick={onConfirm}
          >
            {confirming ? 'Confirming…' : 'Confirm Upgrade'}
          </button>
          <button
            type="button"
            className="btn-secondary"
            data-testid="billing-upgrade-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const PLAN_PRICES = { Standard: '20', Premium: '40' }

export default function Billing() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [successBanner, setSuccessBanner] = useState(null)

  const fetchBilling = useCallback(
    () =>
      fetch(`/api/billing?email=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then(setData),
    [token]
  )

  useEffect(() => {
    fetchBilling()
  }, [fetchBilling])

  const openUpgradeModal = () => {
    setModalOpen(true)
    setModalError(null)
    setPreview(null)
    setPreviewLoading(true)
    fetch(`/api/billing/upgrade-preview?email=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setPreview)
      .catch(() => setModalError('Could not load the upgrade preview. Please try again.'))
      .finally(() => setPreviewLoading(false))
  }

  const closeModal = () => {
    setModalOpen(false)
    setPreview(null)
    setModalError(null)
  }

  const confirmUpgrade = () => {
    setConfirming(true)
    setModalError(null)
    fetch('/api/billing/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: token }),
    })
      .then(async (r) => {
        const body = await r.json()
        if (r.ok) {
          await fetchBilling()
          setModalOpen(false)
          setPreview(null)
          setSuccessBanner(`You're now on Premium! $${body.charge.toFixed(2)} was charged.`)
        } else if (r.status === 402) {
          setModalError('Payment failed: Your card was declined. Your plan has not changed.')
        } else {
          setModalError(body.detail || 'The upgrade could not be completed.')
        }
      })
      .catch(() => setModalError('The upgrade could not be completed. Please try again.'))
      .finally(() => setConfirming(false))
  }

  if (!data) {
    return (
      <div className="page-card">
        <p>Loading billing...</p>
      </div>
    )
  }

  return (
    <div className="page-card">
      <div className="billing-header">
        <div className="billing-titles">
          <h2>Plan & Billing</h2>
          <p>Manage your plan and payments</p>
        </div>
      </div>

      {successBanner && <p className="success-banner">{successBanner}</p>}

      <p className="current-label">
        Current plan: <span className="standard-badge">{data.plan_name}</span>
      </p>

      {data.plan_name === 'Standard' && (
        <button
          type="button"
          className="btn upgrade-cta-button"
          data-testid="billing-upgrade-cta-button"
          onClick={openUpgradeModal}
        >
          Upgrade to Premium
        </button>
      )}

      {modalOpen && (
        <UpgradeModal
          preview={preview}
          loading={previewLoading}
          error={modalError}
          confirming={confirming}
          onConfirm={confirmUpgrade}
          onCancel={closeModal}
        />
      )}

      <div className="plan-row">
        <div className="plan-card">
          <div className="plan-top">
            <div>
              <div className="plan-label">Monthly plan</div>
              <p className="plan-price">{data.price}</p>
            </div>
            <div className="badge-group">
              <span className="badge active">Active</span>
            </div>
          </div>
        </div>
        <div className="renew-card">
          <div className="renew-title">Renew at</div>
          <div className="renew-date">{data.renew_at}</div>
        </div>
      </div>

      <div className="section-title">Usage</div>
      <p className="section-sub">Your usage is renewed every month</p>

      <div className="usage-grid">
        {data.usages.map((u) => (
          <div key={u.id} className="usage-card">
            <div className="tooltip">{u.help}</div>
            <div className="usage-icon">
              <UsageIcon id={u.id} />
            </div>
            <div className="usage-label">{u.label}</div>
            <div className="usage-value">
              {u.used} of {u.total}
            </div>
            <div className="usage-bar">
              <div
                className="usage-bar-fill"
                style={{
                  width: `${Math.min(100, (u.used / u.total) * 100)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="usage-extras">
        <IncludedUsageCard data={data.included_usage} />
        <OnDemandUsageCard data={data.on_demand_usage} />
      </div>
    </div>
  )
}
