import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import UpgradeDialog from '../../../../../src/frontend/src/components/UpgradeDialog'

function renderDialog(onClose = vi.fn()) {
  render(<UpgradeDialog currentPlan="Standard ($20/mo)" onClose={onClose} />)
  return onClose
}

describe('UpgradeDialog', () => {
  it('is an accessible modal dialog labelled by its title', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog', { name: 'Upgrade to Premium' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('moves keyboard focus into the dialog when it opens', () => {
    renderDialog()
    expect(screen.getByRole('dialog')).toHaveFocus()
  })

  it('shows the explainer, the plan comparison and the Premium benefits', () => {
    renderDialog()
    const dialog = screen.getByRole('dialog')
    expect(
      within(dialog).getByText(
        "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle.",
      ),
    ).toBeInTheDocument()
    expect(within(dialog).getByText('Current plan').nextElementSibling).toHaveTextContent('Standard ($20/mo)')
    expect(within(dialog).getByText('New plan').nextElementSibling).toHaveTextContent('Premium ($40/mo)')
    const benefits = within(dialog)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(benefits).toEqual([
      '4K Ultra HD video quality',
      'Stream on 4 devices at once',
      'Download on 6 devices',
      'Dolby Vision (select titles)',
    ])
  })

  it('offers Cancel as its only action', () => {
    renderDialog()
    const buttons = within(screen.getByRole('dialog')).getAllByRole('button')
    expect(buttons.map((b) => b.textContent)).toEqual(['Cancel'])
  })

  it('closes when Cancel is clicked', () => {
    const onClose = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when Escape is pressed', () => {
    const onClose = renderDialog()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('ignores other keys', () => {
    const onClose = renderDialog()
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('closes when the backdrop is clicked', () => {
    const onClose = renderDialog()
    fireEvent.click(screen.getByTestId('upgrade-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('stays open when the dialog card itself is clicked', () => {
    const onClose = renderDialog()
    fireEvent.click(screen.getByRole('dialog'))
    fireEvent.click(screen.getByText('New plan'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
