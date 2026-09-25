Feature: Confirm the upgrade from the dialog
  Story 1.8 — frontend only. Confirming sends one upgrade request and
  switches the page to Premium without a reload.

  Background:
    Given the subscriber's billing data has plan "Standard" at "$20/month" renewing "Oct 10, 2026"
    And the subscriber has opened the upgrade dialog
    And the dialog shows "Confirm & pay $10.00" for 15 remaining days

  @AC-1
  Scenario: Confirming sends exactly one upgrade request
    Given the upgrade request has not responded yet
    When the subscriber clicks "Confirm & pay $10.00" twice
    Then exactly one upgrade request is sent for the subscriber
    And the "Confirm & pay" button is disabled and shows a pending state

  @AC-2
  Scenario: A successful upgrade switches the page to Premium without a reload
    Given the upgrade request succeeds with plan "Premium" at "$40/month" renewing "Oct 10, 2026"
    When the subscriber clicks "Confirm & pay $10.00"
    Then the dialog is closed
    And the page was not reloaded
    And the "Current plan:" badge reads "Premium"
    And the monthly plan card shows "$40/month"
    And the renewal card shows "Oct 10, 2026"
    And the heading reads "What's included with Premium"
    And the feature cards show "4K Ultra HD", "Can watch on 4 devices at once" and "Can download on 6 devices"
    And no "Upgrade to Premium" button is shown

  @AC-3
  Scenario: The confirmation panel states what was charged
    Given the upgrade request succeeds with a prorated charge of 10.0 for 15 days remaining
    When the subscriber clicks "Confirm & pay $10.00"
    Then a panel titled "Upgraded to Premium" is shown
    And the panel reads "Charged $10.00 for the remaining 15 days of this billing cycle. From Oct 10, 2026 you will be billed $40/month."

  @AC-4
  Scenario: After a reload the page shows Premium without the panel
    Given the subscriber has upgraded to Premium
    When the subscriber reloads the Billing page
    Then the "Current plan:" badge reads "Premium"
    And no "Upgrade to Premium" button is shown
    And no "Upgraded to Premium" panel is shown
