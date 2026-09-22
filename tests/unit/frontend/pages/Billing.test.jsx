// Unit tests for the Billing page's Self-Serve Premium Upgrade UI (Story 1.1).
// Traces to: REQ-F-01, REQ-F-02, REQ-F-03, REQ-F-09, REQ-F-10, REQ-F-12, REQ-F-13, REQ-F-14, REQ-F-15,
// AC-1, AC-2, AC-3, AC-4, AC-8, AC-9, AC-10.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Billing from '../../../../src/frontend/src/pages/Billing'

vi.mock('../../../../src/frontend/src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'tpg@example.com' }),
}))

const STANDARD_BILLING = {
  plan_name: 'Standard',
  price: '$20/month',
  renew_at: 'Oct 30, 2026',
  usages: [
    { id: 'video-quality', label: 'Video quality', type: 'feature', value: 'Full HD (1080p)', help: 'help' },
  ],
  included_usage: { title: 'Plan perks', items: [{ id: 'ad-free', label: 'Ad-free streaming', used_percent: 100 }], help: 'help' },
}

const PREMIUM_UPGRADE_RESPONSE = {
  plan_name: 'Premium',
  price: '$40/month',
  renew_at: 'Oct 30, 2026',
  prorated_charge: 10.0,
  usages: [
    { id: 'video-quality', label: 'Video quality', type: 'feature', value: '4K Ultra HD', help: 'help' },
  ],
  included_usage: { title: 'Plan perks', items: [{ id: 'dolby-vision', label: 'Dolby Vision', used_percent: 100 }], help: 'help' },
}

function mockGetBilling(payload) {
  global.fetch = vi.fn((url) => {
    if (typeof url === 'string' && url.startsWith('/api/billing?')) {
      return Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })
    }
    throw new Error(`Unexpected fetch call: ${url}`)
  })
}

describe('Billing page — Self-Serve Premium Upgrade', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('AC-1: renders the Standard plan name dynamically', async () => {
    mockGetBilling(STANDARD_BILLING)
    render(<Billing />)

    await screen.findByText('Standard', { selector: '.plan-badge' })
    expect(screen.getByText("What's included with Standard")).toBeInTheDocument()
  })

  it('AC-2: shows the Upgrade CTA for a Standard-plan user', async () => {
    mockGetBilling(STANDARD_BILLING)
    render(<Billing />)

    expect(await screen.findByRole('button', { name: /upgrade to premium/i })).toBeInTheDocument()
  })

  it('AC-2: hides the Upgrade CTA for a Premium-plan user', async () => {
    mockGetBilling({ ...STANDARD_BILLING, plan_name: 'Premium' })
    render(<Billing />)

    await screen.findByText('Premium', { selector: '.plan-badge' })
    expect(screen.queryByRole('button', { name: /upgrade to premium/i })).not.toBeInTheDocument()
  })

  it('AC-3: opens the confirmation modal with a computed prorated preview', async () => {
    mockGetBilling(STANDARD_BILLING)
    render(<Billing />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /upgrade to premium/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/remaining days/i)).toBeInTheDocument()
    expect(screen.getByText(/charge today/i)).toBeInTheDocument()
    expect(screen.getByText(/4k ultra hd/i)).toBeInTheDocument()
    expect(screen.getByText(/dolby vision/i)).toBeInTheDocument()
  })

  it('AC-4: Cancel closes the modal without calling the upgrade endpoint', async () => {
    mockGetBilling(STANDARD_BILLING)
    render(<Billing />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /upgrade to premium/i }))
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalledWith(
      '/api/billing/upgrade',
      expect.anything()
    )
  })

  it('AC-8/AC-9: successful confirm updates the page from the response and shows the success banner, with no re-fetch', async () => {
    mockGetBilling(STANDARD_BILLING)
    render(<Billing />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /upgrade to premium/i }))

    global.fetch.mockImplementationOnce((url, opts) => {
      expect(url).toBe('/api/billing/upgrade')
      expect(opts.method).toBe('POST')
      return Promise.resolve({ ok: true, json: () => Promise.resolve(PREMIUM_UPGRADE_RESPONSE) })
    })

    await user.click(screen.getByRole('button', { name: /confirm & pay/i }))

    await screen.findByText('Premium', { selector: '.plan-badge' })
    expect(screen.getByText(/upgraded to premium/i)).toBeInTheDocument()
    expect(screen.getByText(/charged \$10\.00/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /upgrade to premium/i })).not.toBeInTheDocument()
    // Only 2 fetch calls total: the initial GET, and the POST — no extra re-fetch of GET /api/billing.
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('AC-10: shows an inline error and allows retry when the upgrade request fails', async () => {
    mockGetBilling(STANDARD_BILLING)
    render(<Billing />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /upgrade to premium/i }))

    global.fetch.mockImplementationOnce(() =>
      Promise.resolve({ ok: false, status: 500, json: () => Promise.resolve({ detail: 'boom' }) })
    )

    await user.click(screen.getByRole('button', { name: /confirm & pay/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('boom')
    // Modal is still open, allowing retry.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /confirm & pay/i })).not.toBeDisabled()
  })
})
