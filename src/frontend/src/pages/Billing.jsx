import { useEffect, useState } from 'react'
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
  if (id === 'video-quality') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
        <circle cx="12" cy="12" r="10" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (id === 'screens') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
        <rect x="2" y="4" width="14" height="10" rx="1" />
        <path d="M6 18h6" />
        <path d="M9 14v4" />
        <rect x="17" y="9" width="5" height="8" rx="1" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
      <path d="M12 3v12" />
      <path d="M7 10l5 5 5-5" />
      <path d="M4 20h16" />
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
        </div>
      ))}
    </div>
  )
}

const PREMIUM_PRICE = 40
const STANDARD_PRICE = 20
const DAYS_IN_CYCLE = 30

function parseRenewAt(renewAt) {
  return new Date(renewAt)
}

function calculateDaysRemaining(renewAt) {
  const renewDate = parseRenewAt(renewAt)
  const today = new Date()
  const diffDays = Math.ceil((renewDate - today) / (1000 * 60 * 60 * 24))
  return Math.max(0, Math.min(DAYS_IN_CYCLE, diffDays))
}

function calculateProratedCharge(daysRemaining) {
  return Number(
    (((PREMIUM_PRICE - STANDARD_PRICE) * daysRemaining) / DAYS_IN_CYCLE).toFixed(2)
  )
}

function UpgradeModal({ data, onClose, onUpgraded }) {
  const { token } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const daysRemaining = calculateDaysRemaining(data.renew_at)
  const prorated = calculateProratedCharge(daysRemaining)

  const handleConfirm = () => {
    setSubmitting(true)
    setError(null)
    fetch('/api/billing/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: token }),
    })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}))
          throw new Error(body.detail || 'Upgrade failed. Please try again.')
        }
        return r.json()
      })
      .then((response) => {
        setSubmitting(false)
        onUpgraded(response)
      })
      .catch((err) => {
        setSubmitting(false)
        setError(err.message || 'Upgrade failed. Please try again.')
      })
  }

  return (
    <div className="upgrade-modal-overlay" role="presentation">
      <div className="upgrade-modal" role="dialog" aria-modal="true" aria-labelledby="upgrade-modal-title">
        <h3 id="upgrade-modal-title" className="upgrade-modal-title">
          Upgrade to Premium
        </h3>
        <p className="upgrade-modal-subtitle">
          Premium is ${PREMIUM_PRICE}/month. You&apos;ll be charged a prorated amount for the rest of
          this cycle.
        </p>

        <div className="upgrade-modal-stats">
          <div className="upgrade-modal-stat-row">
            <span>Remaining days</span>
            <span className="upgrade-modal-stat-value">{daysRemaining} days</span>
          </div>
          <div className="upgrade-modal-stat-row">
            <span>Charge today</span>
            <span className="upgrade-modal-stat-value upgrade-modal-charge">
              ${prorated.toFixed(2)}
            </span>
          </div>
        </div>

        <ul className="upgrade-modal-highlights">
          <li>4K Ultra HD</li>
          <li>4 simultaneous streams</li>
          <li>6 download devices</li>
          <li>Dolby Vision</li>
        </ul>

        {error && (
          <div className="upgrade-modal-error" role="alert">
            {error}
          </div>
        )}

        <div className="upgrade-modal-actions">
          <button
            type="button"
            className="upgrade-modal-confirm"
            onClick={handleConfirm}
            disabled={submitting}
          >
            {submitting ? 'Processing…' : `Confirm & pay $${prorated.toFixed(2)}`}
          </button>
          <button
            type="button"
            className="upgrade-modal-cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function UpgradeSuccessBanner({ prorated, daysRemaining, renewAt }) {
  return (
    <div className="upgrade-success-banner">
      <p className="upgrade-success-text">
        <strong className="upgrade-success-title">Upgraded to Premium</strong> — Charged $
        {prorated.toFixed(2)} for the remaining {daysRemaining} days of this billing cycle. From{' '}
        {renewAt} you will be billed ${PREMIUM_PRICE}/month.
      </p>
    </div>
  )
}

export default function Billing() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [justUpgraded, setJustUpgraded] = useState(null)

  useEffect(() => {
    fetch(`/api/billing?email=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setData)
  }, [token])

  if (!data) {
    return (
      <div className="page-card">
        <p>Loading billing...</p>
      </div>
    )
  }

  const isPremium = data.plan_name === 'Premium'

  const handleUpgraded = (response) => {
    setJustUpgraded({
      prorated: response.prorated_charge,
      daysRemaining: calculateDaysRemaining(response.renew_at),
      renewAt: response.renew_at,
    })
    setData(response)
    setModalOpen(false)
  }

  return (
    <div className="page-card">
      <div className="billing-header">
        <div className="billing-titles">
          <h2>Plan & Billing</h2>
          <p>Manage your plan and payments</p>
        </div>
        {!isPremium && (
          <button
            type="button"
            className="upgrade-cta"
            onClick={() => setModalOpen(true)}
          >
            Upgrade to Premium
          </button>
        )}
      </div>

      <p className="current-label">
        Current plan: <span className="plan-badge">{data.plan_name}</span>
      </p>
      <p className="section-sub">Unlimited movies, TV shows and more. Watch anywhere. Cancel anytime.</p>

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

      {justUpgraded && isPremium && (
        <UpgradeSuccessBanner
          prorated={justUpgraded.prorated}
          daysRemaining={justUpgraded.daysRemaining}
          renewAt={justUpgraded.renewAt}
        />
      )}

      <div className="section-title">What&apos;s included with {data.plan_name}</div>
      <p className="section-sub">Your plan's streaming features</p>

      <div className="usage-grid">
        {data.usages.map((u) => (
          <div key={u.id} className="usage-card">
            <div className="tooltip">{u.help}</div>
            <div className="usage-icon">
              <UsageIcon id={u.id} />
            </div>
            <div className="usage-label">{u.label}</div>
            {u.type === 'feature' ? (
              <div className="usage-value">{u.value}</div>
            ) : (
              <>
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
              </>
            )}
          </div>
        ))}
      </div>

      <div className="usage-extras usage-extras-single">
        <IncludedUsageCard data={data.included_usage} />
      </div>

      {modalOpen && (
        <UpgradeModal
          data={data}
          onClose={() => setModalOpen(false)}
          onUpgraded={handleUpgraded}
        />
      )}
    </div>
  )
}
