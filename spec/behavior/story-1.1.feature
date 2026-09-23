Feature: Upgrade CTA & Confirmation Modal (Story 1.1)

  Background:
    Given a user "TPG" exists with email "tpg@example.com"
    And "TPG" has an active "Standard" subscription at $20/month
    And 15 days remain in the 30-day billing cycle, renewing on "Oct 30, 2026"
    And "TPG" is viewing the Billing page

  @AC-1
  Scenario: Upgrade CTA is visible for a Standard-plan user
    Then an "Upgrade to Premium" button is visible, positioned top-right of the "Plan & Billing" heading

  @AC-2
  Scenario: Clicking the CTA opens a confirmation modal with the correct prorated preview
    When "TPG" clicks "Upgrade to Premium"
    Then a modal opens titled "Upgrade to Premium"
    And the modal shows the body copy "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
    And the modal shows "Remaining days" as "15 days"
    And the modal shows "Charge today" as "$10.00"

  @AC-3
  Scenario: The modal lists exactly the 3 approved benefit bullets, no more
    When "TPG" clicks "Upgrade to Premium"
    Then the modal lists exactly these 3 bullets: "Stream on 4 devices at once", "Download on 4 devices", "4K + HDR video quality"
    And the modal does not list "Dolby Vision" or any other bullet

  @AC-4
  Scenario: The modal offers Confirm and Cancel actions
    When "TPG" clicks "Upgrade to Premium"
    Then the modal shows a primary button labeled "Confirm & pay $10.00"
    And the modal shows a secondary "Cancel" button
    When "TPG" clicks "Cancel"
    Then the modal closes and "TPG" still shows "Current plan: Standard" at "$20/month"

  @AC-5
  Scenario: The Confirm button disables immediately to prevent a duplicate submission
    Given "TPG" has opened the upgrade confirmation modal
    When "TPG" clicks "Confirm & pay $10.00"
    Then the "Confirm & pay $10.00" button becomes disabled immediately
    And a second click on the same button does not submit a second request while the first is in flight
