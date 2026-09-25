import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Billing from '../../../../../src/frontend/src/pages/Billing'

vi.mock('../../../../../src/frontend/src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'tpg@example.com' }),
}))

function billingPayload(overrides = {}) {
  return {
    plan_name: 'Standard',
    price: '$20/month',
    renew_at: 'Oct 30, 2026',
    usages: [
      { id: 'video-quality', label: 'Video quality', type: 'feature', value: 'Full HD (1080p)', help: 'h' },
      { id: 'screens', label: 'Watch at the same time', type: 'feature', value: 'Can watch on 2 devices at once', help: 'h' },
      { id: 'downloads', label: 'Download on devices', type: 'usage', used: 1, total: 2, help: 'h' },
    ],
    included_usage: {
      title: 'Plan perks',
      items: [{ id: 'ad-free', label: 'Ad-free streaming', used_percent: 100 }],
      help: 'h',
    },
    ...overrides,
  }
}

let fetchMock

function stubBilling(payload) {
  fetchMock = vi.fn(() => Promise.resolve({ json: () => Promise.resolve(payload) }))
  vi.stubGlobal('fetch', fetchMock)
}

function upgradeRequests() {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes('/upgrade'))
}

beforeEach(() => {
  stubBilling(billingPayload())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Billing page — Premium upgrade entry point', () => {
  it('shows a loading message until the billing data arrives', () => {
    fetchMock.mockImplementation(() => new Promise(() => {}))
    render(<Billing />)
    expect(screen.getByText('Loading billing...')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Upgrade to Premium' })).not.toBeInTheDocument()
  })

  it('requests the billing data for the signed-in user', async () => {
    render(<Billing />)
    await screen.findByText('Plan & Billing')
    expect(fetchMock).toHaveBeenCalledWith('/api/billing?email=tpg%40example.com')
  })

  it('shows the Upgrade to Premium button in the title row for a Standard subscriber', async () => {
    render(<Billing />)
    const button = await screen.findByRole('button', { name: 'Upgrade to Premium' })
    expect(button).toHaveClass('upgrade-cta')
    expect(button.closest('.billing-header')).not.toBeNull()
  })

  it('does not offer an upgrade to a Premium subscriber', async () => {
    stubBilling(billingPayload({ plan_name: 'Premium', price: '$40/month' }))
    render(<Billing />)
    await screen.findByText('Plan & Billing')
    expect(screen.queryByRole('button', { name: 'Upgrade to Premium' })).not.toBeInTheDocument()
  })

  it('opens the dialog with the current plan taken from the billing data, without any request', async () => {
    render(<Billing />)
    fireEvent.click(await screen.findByRole('button', { name: 'Upgrade to Premium' }))
    expect(screen.getByRole('dialog', { name: 'Upgrade to Premium' })).toBeInTheDocument()
    expect(screen.getByText('Current plan').nextElementSibling).toHaveTextContent('Standard ($20/mo)')
    expect(upgradeRequests()).toHaveLength(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['clicking Cancel', () => fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))],
    ['pressing Escape', () => fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })],
    ['clicking the backdrop', () => fireEvent.click(screen.getByTestId('upgrade-backdrop'))],
  ])('closes on %s, returns focus to the button and changes nothing', async (_label, dismiss) => {
    render(<Billing />)
    const button = await screen.findByRole('button', { name: 'Upgrade to Premium' })
    fireEvent.click(button)
    dismiss()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()
    expect(screen.getByText('$20/month')).toBeInTheDocument()
    expect(upgradeRequests()).toHaveLength(0)
  })

  it('still renders usage-style cards with their progress bars', async () => {
    render(<Billing />)
    expect(await screen.findByText('1 of 2')).toBeInTheDocument()
  })
})
