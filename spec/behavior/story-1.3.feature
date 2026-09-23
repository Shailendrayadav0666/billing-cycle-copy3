Feature: Successful Upgrade — Immediate Plan Update (Story 1.3)

  Background:
    Given a user "TPG" exists with email "tpg@example.com"
    And "TPG" has an active "Standard" subscription at $20/month
    And 15 days remain in the 30-day billing cycle, renewing on "Oct 30, 2026"
    And "TPG" is viewing the Billing page with the upgrade confirmation modal open

  @AC-1
  Scenario: The plan pill and price update immediately on success, with no page reload
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request succeeds
    Then the modal closes
    And the "Current plan" pill updates to "Premium"
    And the plan card updates to "$40/month"
    And no page reload occurs

  @AC-2
  Scenario: A success banner reports the exact amount charged and the future billing date
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request succeeds
    Then a success banner appears with heading "Upgraded to Premium"
    And the banner body reads "Charged $10.00 for the remaining 15 days of this billing cycle. From Oct 30, 2026 you will be billed $40/month."

  @AC-3
  Scenario: The feature cards update to the Premium values with no Dolby Vision element
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request succeeds
    Then the "What's included" section re-labels to "What's included with Premium"
    And the video quality card shows "4K + HDR"
    And the "watch at the same time" card shows "Can watch on 4 devices at once"
    And the "download on devices" card shows "Can download on 4 devices"
    And no Dolby Vision card or element is shown

  @AC-4
  Scenario: The Upgrade CTA is removed once the plan is Premium
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request succeeds
    Then the "Upgrade to Premium" button is no longer rendered on the Billing page
