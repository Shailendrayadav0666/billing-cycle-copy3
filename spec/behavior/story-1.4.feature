Feature: Upgrade Failure Handling (Story 1.4)

  Background:
    Given a user "TPG" exists with email "tpg@example.com"
    And "TPG" has an active "Standard" subscription at $20/month
    And 15 days remain in the 30-day billing cycle, renewing on "Oct 30, 2026"
    And "TPG" is viewing the Billing page with the upgrade confirmation modal open

  @AC-1
  Scenario: The modal stays open when the upgrade request fails
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request fails with a network error
    Then the modal remains open

  @AC-2
  Scenario: An inline error message is shown inside the modal
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request fails with a non-2xx response
    Then an inline error message is shown inside the modal

  @AC-3
  Scenario: The Confirm button is re-enabled after a failure so the user can retry
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request fails
    Then the "Confirm & pay $10.00" button becomes enabled again
    When "TPG" clicks "Confirm & pay $10.00" again and the request succeeds
    Then the modal closes and "Current plan" updates to "Premium"

  @AC-4
  Scenario: No plan or price state outside the modal changes after a failure
    When "TPG" clicks "Confirm & pay $10.00" and the upgrade request fails
    Then "TPG" still shows "Current plan: Standard" at "$20/month" on the Billing page
    And the "What's included with Standard" section is unchanged
