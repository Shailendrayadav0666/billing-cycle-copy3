// Step definitions for spec/behavior/story-1.1.feature — bound to the Billing
// page as a subscriber sees it (rendered DOM, keyboard and mouse events).
import path from 'node:path'
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, vi } from 'vitest'
import Billing from '../../../src/frontend/src/pages/Billing'
import { billingPayload, requestsTo, stubBillingApi } from '../support/billing-api'

vi.mock('../../../src/frontend/src/context/AuthContext', () => ({
  useAuth: () => ({ token: 'tpg@example.com' }),
}))

const feature = await loadFeature(
  path.resolve(import.meta.dirname, '../../../spec/behavior/story-1.1.feature'),
)

const PLANS = {
  Standard: billingPayload(),
  Premium: billingPayload({ plan_name: 'Premium', price: '$40/month' }),
}

describeFeature(feature, ({ Background, Scenario, ScenarioOutline, AfterEachScenario }) => {
  let api
  let user

  AfterEachScenario(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  Background(({ Given }) => {
    Given('the Billing page is rendered for a logged-in subscriber', () => {
      user = userEvent.setup()
    })
  })

  async function loadPage(planName) {
    api = stubBillingApi(PLANS[planName])
    render(<Billing />)
    await screen.findByText('Plan & Billing')
  }

  function upgradeButton() {
    return screen.queryByRole('button', { name: 'Upgrade to Premium' })
  }

  Scenario('A Standard subscriber sees the Upgrade to Premium button', ({ Given, When, Then }) => {
    Given(`the subscriber's billing data has plan "Standard" at "$20/month"`, () => {
      api = stubBillingApi(PLANS.Standard)
    })
    When('the Billing page loads', async () => {
      render(<Billing />)
      await screen.findByText('Plan & Billing')
    })
    Then('an "Upgrade to Premium" button is shown in the "Plan & Billing" title row', () => {
      const header = screen.getByText('Plan & Billing').closest('.billing-header')
      expect(within(header).getByRole('button', { name: 'Upgrade to Premium' })).toBeVisible()
    })
  })

  Scenario('A Premium subscriber is not offered an upgrade', ({ Given, When, Then }) => {
    Given(`the subscriber's billing data has plan "Premium" at "$40/month"`, () => {
      api = stubBillingApi(PLANS.Premium)
    })
    When('the Billing page loads', async () => {
      render(<Billing />)
      await screen.findByText('Plan & Billing')
    })
    Then('no "Upgrade to Premium" button is shown', () => {
      expect(upgradeButton()).toBeNull()
    })
  })

  Scenario(
    'Opening the dialog shows the plan comparison and Premium benefits',
    ({ Given, When, Then, And }) => {
      let dialog
      Given(`the subscriber's billing data has plan "Standard" at "$20/month"`, async () => {
        await loadPage('Standard')
      })
      When('the subscriber clicks "Upgrade to Premium"', async () => {
        await user.click(upgradeButton())
        dialog = screen.getByRole('dialog')
      })
      Then('a dialog titled "Upgrade to Premium" is shown over the page', () => {
        expect(screen.getByRole('dialog', { name: 'Upgrade to Premium' })).toBe(dialog)
        expect(dialog.closest('.upgrade-overlay')).not.toBeNull()
      })
      And(
        `the dialog reads "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."`,
        () => {
          expect(
            within(dialog).getByText(
              "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle.",
            ),
          ).toBeVisible()
        },
      )
      And('the dialog shows "Current plan" as "Standard ($20/mo)"', () => {
        expect(within(dialog).getByText('Current plan').nextElementSibling).toHaveTextContent('Standard ($20/mo)')
      })
      And('the dialog shows "New plan" as "Premium ($40/mo)"', () => {
        expect(within(dialog).getByText('New plan').nextElementSibling).toHaveTextContent('Premium ($40/mo)')
      })
      And(
        'the dialog lists the benefits "4K Ultra HD video quality", "Stream on 4 devices at once", "Download on 6 devices" and "Dolby Vision (select titles)"',
        () => {
          const items = within(dialog).getAllByRole('listitem').map((li) => li.textContent)
          expect(items).toEqual([
            '4K Ultra HD video quality',
            'Stream on 4 devices at once',
            'Download on 6 devices',
            'Dolby Vision (select titles)',
          ])
        },
      )
      And('the dialog shows a "Cancel" button', () => {
        expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeVisible()
      })
      And('no request has been sent to any upgrade endpoint', () => {
        expect(requestsTo(api, '/upgrade')).toHaveLength(0)
      })
    },
  )

  ScenarioOutline(
    'Dismissing the dialog leaves the page unchanged',
    ({ Given, When, Then, And }, variables) => {
      Given('the subscriber has opened the upgrade dialog', async () => {
        await loadPage('Standard')
        await user.click(upgradeButton())
        expect(screen.getByRole('dialog')).toBeVisible()
      })
      When('the subscriber dismisses it by <action>', async () => {
        const action = variables.action
        if (action === 'clicking "Cancel"') await user.click(screen.getByRole('button', { name: 'Cancel' }))
        else if (action === 'pressing Escape') await user.keyboard('{Escape}')
        else if (action === 'clicking the backdrop') fireEvent.click(screen.getByTestId('upgrade-backdrop'))
        else throw new Error(`unknown dismiss action: ${action}`)
      })
      Then('the dialog is closed', () => {
        expect(screen.queryByRole('dialog')).toBeNull()
      })
      And('the Billing page still shows plan "Standard" at "$20/month"', () => {
        expect(screen.getByText('$20/month')).toBeVisible()
        expect(upgradeButton()).toBeVisible()
      })
      And('no request has been sent to any upgrade endpoint', () => {
        expect(requestsTo(api, '/upgrade')).toHaveLength(0)
      })
    },
  )

  Scenario('The dialog is accessible from the keyboard', ({ Given, When, Then, And }) => {
    Given(`the subscriber's billing data has plan "Standard" at "$20/month"`, async () => {
      await loadPage('Standard')
    })
    When('the subscriber activates "Upgrade to Premium" with the keyboard', async () => {
      upgradeButton().focus()
      await user.keyboard('{Enter}')
    })
    Then('the dialog has role "dialog" and is marked as modal', () => {
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })
    And('the dialog is labelled "Upgrade to Premium"', () => {
      expect(screen.getByRole('dialog', { name: 'Upgrade to Premium' })).toBeInTheDocument()
    })
    And('keyboard focus is inside the dialog', () => {
      expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true)
    })
    When('the subscriber presses Escape', async () => {
      await user.keyboard('{Escape}')
    })
    Then('keyboard focus returns to the "Upgrade to Premium" button', () => {
      expect(upgradeButton()).toHaveFocus()
    })
  })
})
