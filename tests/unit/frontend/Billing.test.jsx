// Unit tests for Story 1.1 — Mid-Cycle Subscription Upgrade (frontend half).
// Covers REQ-F-01/03/05/06, REQ-NF-02/03/05. See spec/plans/stories.md Story 1.1.
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('../../../src/frontend/src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'sam@example.com' }),
}))

import Billing from '../../../src/frontend/src/pages/Billing.jsx'

const standardBilling = {
  plan_name: 'Standard',
  price: '$20/month',
  renew_at: 'Oct 11, 2026',
  usages: [],
  included_usage: { title: 'Your included usage', items: [], help: '' },
  on_demand_usage: { title: 'On-demand usage', remaining_balance: '$0.00', your_usage: '$0.00', help: '', notice: 'not available' },
}

const premiumBilling = { ...standardBilling, plan_name: 'Premium', price: '$40/month' }

const previewResponse = {
  current_plan: 'Standard',
  new_plan: 'Premium',
  days_remaining: 15,
  prorated_charge: 10.0,
  next_renewal_price: 40.0,
  renew_at: 'Oct 11, 2026',
}

function mockFetchSequence(responses) {
  let call = 0
  global.fetch = vi.fn(() => {
    const entry = responses[Math.min(call, responses.length - 1)]
    call += 1
    return Promise.resolve({
      ok: entry.status < 400,
      status: entry.status,
      json: () => Promise.resolve(entry.body),
    })
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('AC-1..AC-4: plan badge and CTA', () => {
  it('shows the real plan name and the Upgrade CTA for a Standard subscriber', async () => {
    mockFetchSequence([{ status: 200, body: standardBilling }])
    render(<Billing />)
    await waitFor(() => expect(screen.getByText('Standard')).toBeInTheDocument())
    expect(screen.getByTestId('billing-upgrade-cta-button')).toHaveTextContent('Upgrade to Premium')
  })

  it('hides the Upgrade CTA for a Premium subscriber', async () => {
    mockFetchSequence([{ status: 200, body: premiumBilling }])
    render(<Billing />)
    await waitFor(() => expect(screen.getByText('Premium')).toBeInTheDocument())
    expect(screen.queryByTestId('billing-upgrade-cta-button')).not.toBeInTheDocument()
  })
})

describe('error handling', () => {
  it('shows an error in the modal when the preview fetch rejects (network failure)', async () => {
    mockFetchSequence([{ status: 200, body: standardBilling }])
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(standardBilling) })
      .mockRejectedValueOnce(new Error('network down'))
    render(<Billing />)
    await userEvent.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await waitFor(() =>
      expect(screen.getByText('Could not load the upgrade preview. Please try again.')).toBeInTheDocument()
    )
  })

  it('shows a generic error when the upgrade endpoint returns an unexpected non-402 error status', async () => {
    mockFetchSequence([
      { status: 200, body: standardBilling },
      { status: 200, body: previewResponse },
      { status: 409, body: { detail: 'already_premium' } },
    ])
    render(<Billing />)
    await userEvent.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByTestId('billing-upgrade-confirm-button'))
    await waitFor(() => expect(screen.getByText('already_premium')).toBeInTheDocument())
  })

  it('shows a generic error when the upgrade fetch itself rejects (network failure)', async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(standardBilling) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(previewResponse) })
      .mockRejectedValueOnce(new Error('network down'))
    render(<Billing />)
    await userEvent.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByTestId('billing-upgrade-confirm-button'))
    await waitFor(() =>
      expect(screen.getByText('The upgrade could not be completed. Please try again.')).toBeInTheDocument()
    )
  })
})

describe('AC-9..AC-12: confirmation modal', () => {
  it('opens the modal, fetches the preview, and displays every field verbatim', async () => {
    mockFetchSequence([{ status: 200, body: standardBilling }, { status: 200, body: previewResponse }])
    render(<Billing />)
    await waitFor(() => screen.getByTestId('billing-upgrade-cta-button'))
    await userEvent.click(screen.getByTestId('billing-upgrade-cta-button'))

    const modal = await screen.findByRole('dialog')
    await waitFor(() => expect(within(modal).getByText(/\$10\.00/)).toBeInTheDocument())
    expect(within(modal).getByText('Standard ($20/mo)')).toBeInTheDocument()
    expect(within(modal).getByText('Premium ($40/mo)')).toBeInTheDocument()
    expect(within(modal).getByText('15')).toBeInTheDocument()
    expect(within(modal).getByText(/\$40\.00\/month starting Oct 11, 2026/)).toBeInTheDocument()
  })

  it('Cancel closes the modal with no side effects (AC-11)', async () => {
    mockFetchSequence([{ status: 200, body: standardBilling }, { status: 200, body: previewResponse }])
    render(<Billing />)
    await userEvent.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await screen.findByRole('dialog')

    await userEvent.click(screen.getByTestId('billing-upgrade-cancel-button'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
  })
})

describe('AC-13/14/20/21/22: confirm upgrade — success', () => {
  it('re-fetches billing, closes the modal, hides the CTA, and shows the exact charge', async () => {
    mockFetchSequence([
      { status: 200, body: standardBilling }, // initial GET /api/billing
      { status: 200, body: previewResponse }, // GET /api/billing/upgrade-preview
      { status: 200, body: { status: 'success', plan: 'Premium', charge: 10.0 } }, // POST /api/billing/upgrade
      { status: 200, body: premiumBilling }, // re-fetch GET /api/billing
    ])
    render(<Billing />)
    await userEvent.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByTestId('billing-upgrade-confirm-button'))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByText("You're now on Premium! $10.00 was charged.")).toBeInTheDocument()
    expect(screen.queryByTestId('billing-upgrade-cta-button')).not.toBeInTheDocument()
  })
})

describe('usage cards render real data', () => {
  it('renders every usage icon variant and the included-usage rows', async () => {
    const populatedBilling = {
      ...standardBilling,
      usages: [
        { id: 'chat-credits', help: 'Chat credits help', label: 'Chat credits', used: 100, total: 10000 },
        { id: 'chatbots', help: 'Chatbots help', label: 'Chatbots', used: 2, total: 10 },
        { id: 'documents-pages', help: 'Docs help', label: 'Document pages', used: 50, total: 5000 },
      ],
      included_usage: {
        title: 'Your included usage',
        help: '',
        items: [{ id: 'seats', label: 'Seats', used_percent: 40, resets_in: '12 days' }],
      },
    }
    mockFetchSequence([{ status: 200, body: populatedBilling }])
    render(<Billing />)

    await waitFor(() => expect(screen.getByText('Chat credits')).toBeInTheDocument())
    expect(screen.getByText('Chatbots')).toBeInTheDocument()
    expect(screen.getByText('Document pages')).toBeInTheDocument()
    expect(screen.getByText('100 of 10000')).toBeInTheDocument()

    expect(screen.getByText('Your included usage')).toBeInTheDocument()
    expect(screen.getByText('Seats')).toBeInTheDocument()
    expect(screen.getByText('40% used')).toBeInTheDocument()
    expect(screen.getByText('Resets in 12 days')).toBeInTheDocument()
  })
})

describe('AC-13/18/23/24/25: confirm upgrade — decline', () => {
  it('keeps the modal open and shows the inline decline error', async () => {
    mockFetchSequence([
      { status: 200, body: standardBilling },
      { status: 200, body: previewResponse },
      { status: 402, body: { detail: 'card_declined', message: 'Your card was declined.' } },
    ])
    render(<Billing />)
    await userEvent.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByTestId('billing-upgrade-confirm-button'))

    await waitFor(() =>
      expect(
        screen.getByText('Payment failed: Your card was declined. Your plan has not changed.')
      ).toBeInTheDocument()
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('Cancel after a decline leaves the plan on Standard (AC-25)', async () => {
    mockFetchSequence([
      { status: 200, body: standardBilling },
      { status: 200, body: previewResponse },
      { status: 402, body: { detail: 'card_declined', message: 'Your card was declined.' } },
    ])
    render(<Billing />)
    await userEvent.click(await screen.findByTestId('billing-upgrade-cta-button'))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByTestId('billing-upgrade-confirm-button'))
    await screen.findByText('Payment failed: Your card was declined. Your plan has not changed.')

    await userEvent.click(screen.getByTestId('billing-upgrade-cancel-button'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Standard')).toBeInTheDocument()
  })
})
