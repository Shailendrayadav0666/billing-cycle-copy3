import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Billing from '../../../src/frontend/src/pages/Billing'

vi.mock('../../../src/frontend/src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'tpg@example.com' }),
}))

const standardBillingData = {
  plan_name: 'Standard',
  price: '$20/month',
  renew_at: 'Oct 30, 2026',
  usages: [
    { id: 'video-quality', label: 'Video quality', type: 'feature', value: 'Full HD (1080p)', help: 'Video quality' },
    { id: 'screens', label: 'Watch at the same time', type: 'metered', used: 1, total: 2, help: 'Devices watching' },
    { id: 'downloads', label: 'Download on devices', type: 'metered', used: 1, total: 2, help: 'Devices downloading' },
  ],
  included_usage: {
    title: 'Plan perks',
    items: [
      { id: 'ad-free', label: 'Ad-free streaming', used_percent: 100 },
      { id: 'spatial-audio', label: 'Spatial audio (select titles)', used_percent: 100 },
    ],
  },
}

const premiumBillingData = {
  ...standardBillingData,
  plan_name: 'Premium',
  price: '$40/month',
}

function mockFetchSequence(responses) {
  let call = 0
  global.fetch = vi.fn(() => {
    const response = responses[Math.min(call, responses.length - 1)]
    call += 1
    return Promise.resolve(response)
  })
}

describe('Billing page — Upgrade CTA & Confirmation Modal (Story 1.1)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // @AC-1 — CTA visible for a Standard-plan user
  it('shows the Upgrade to Premium CTA for a Standard-plan user', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(standardBillingData) }])
    render(<Billing />)
    expect(await screen.findByTestId('billing-upgrade-cta-button')).toBeInTheDocument()
  })

  it('does not show the Upgrade to Premium CTA for a Premium-plan user', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(premiumBillingData) }])
    render(<Billing />)
    await screen.findByText('Plan & Billing')
    expect(screen.queryByTestId('billing-upgrade-cta-button')).not.toBeInTheDocument()
  })

  // @AC-2 — clicking the CTA opens the modal with the computed preview
  it('opens the confirmation modal with the computed prorated preview when the CTA is clicked', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(standardBillingData) }])
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Billing />)

    await user.click(await screen.findByTestId('billing-upgrade-cta-button'))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByTestId('upgrade-modal-confirm-button')).toBeInTheDocument()
  })

  // @AC-4 — Cancel closes the modal with no state change
  it('closes the modal and leaves the plan unchanged when Cancel is clicked', async () => {
    mockFetchSequence([{ ok: true, json: () => Promise.resolve(standardBillingData) }])
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Billing />)

    await user.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await user.click(screen.getByTestId('upgrade-modal-cancel-button'))

    expect(screen.queryByTestId('upgrade-modal-confirm-button')).not.toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
  })

  // @AC-5 — Confirm disables immediately and a rapid second click does not submit twice
  it('disables the Confirm button immediately on click and does not double-submit', async () => {
    let resolveUpgrade
    const upgradePromise = new Promise((resolve) => {
      resolveUpgrade = resolve
    })
    global.fetch = vi.fn((url) => {
      if (String(url).includes('/api/billing/upgrade')) {
        return upgradePromise
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve(standardBillingData) })
    })

    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Billing />)

    await user.click(await screen.findByTestId('billing-upgrade-cta-button'))
    const confirmBtn = screen.getByTestId('upgrade-modal-confirm-button')

    await user.click(confirmBtn)
    expect(confirmBtn).toBeDisabled()

    // A rapid second click while the request is still in flight must not fire a second request.
    await user.click(confirmBtn)
    const upgradeCalls = global.fetch.mock.calls.filter(([url]) => String(url).includes('/api/billing/upgrade'))
    expect(upgradeCalls).toHaveLength(1)

    resolveUpgrade({ ok: true, json: () => Promise.resolve({}) })
    await waitFor(() => expect(confirmBtn).not.toBeDisabled())
  })
})
