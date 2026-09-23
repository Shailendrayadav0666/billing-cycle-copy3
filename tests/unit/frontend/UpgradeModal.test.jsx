import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import UpgradeModal from '../../../src/frontend/src/components/UpgradeModal'

const baseProps = {
  open: true,
  remainingDays: 15,
  charge: '$10.00',
  isSubmitting: false,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('UpgradeModal', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(<UpgradeModal {...baseProps} open={false} />)
    expect(container).toBeEmptyDOMElement()
  })

  // @AC-2 — modal opens with correct title, body copy, remaining days, and charge
  it('shows the correct title, body copy, remaining days and charge', () => {
    render(<UpgradeModal {...baseProps} />)
    expect(screen.getByText('Upgrade to Premium')).toBeInTheDocument()
    expect(
      screen.getByText("Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle.")
    ).toBeInTheDocument()
    expect(screen.getByText('15 days')).toBeInTheDocument()
    expect(screen.getByText('$10.00')).toBeInTheDocument()
  })

  // @AC-3 — exactly the 3 approved benefit bullets, never Dolby Vision
  it('lists exactly the 3 approved benefit bullets and never Dolby Vision', () => {
    render(<UpgradeModal {...baseProps} />)
    const list = screen.getByRole('list')
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Stream on 4 devices at once')
    expect(items[1]).toHaveTextContent('Download on 4 devices')
    expect(items[2]).toHaveTextContent('4K + HDR video quality')
    expect(list).not.toHaveTextContent('Dolby Vision')
  })

  // @AC-4 — Confirm and Cancel buttons present; Cancel invokes onCancel
  it('shows Confirm and Cancel buttons, and Cancel calls onCancel', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<UpgradeModal {...baseProps} onCancel={onCancel} />)

    const confirmBtn = screen.getByTestId('upgrade-modal-confirm-button')
    expect(confirmBtn).toHaveTextContent('Confirm & pay $10.00')

    const cancelBtn = screen.getByTestId('upgrade-modal-cancel-button')
    expect(cancelBtn).toHaveTextContent('Cancel')

    await user.click(cancelBtn)
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when the Confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<UpgradeModal {...baseProps} onConfirm={onConfirm} />)

    await user.click(screen.getByTestId('upgrade-modal-confirm-button'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  // @AC-5 — Confirm/Cancel disabled while a request is in flight (isSubmitting)
  it('disables the Confirm and Cancel buttons while isSubmitting is true', () => {
    render(<UpgradeModal {...baseProps} isSubmitting={true} />)
    expect(screen.getByTestId('upgrade-modal-confirm-button')).toBeDisabled()
    expect(screen.getByTestId('upgrade-modal-cancel-button')).toBeDisabled()
  })
})
