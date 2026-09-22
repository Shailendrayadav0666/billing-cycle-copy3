Feature: Self-Serve Premium Upgrade — Mid-Cycle Standard to Premium

  Background:
    Given a user "tpg@example.com" exists with an active "Standard" plan at "$20/month"
    And the user's "renew_at" date is 15 days from today in a 30-day billing cycle

  @AC-1
  Scenario: Billing page plan display becomes dynamic
    Given the user's plan is "Standard"
    When the Billing page renders
    Then the plan badge reads "Standard"
    And the "What's included with" heading reads "What's included with Standard"

  @AC-1
  Scenario: Dynamic plan display reflects Premium after upgrade
    Given the user's plan is "Premium"
    When the Billing page renders
    Then the plan badge reads "Premium"
    And the "What's included with" heading reads "What's included with Premium"

  @AC-2
  Scenario: Upgrade CTA is visible for a Standard-plan user
    Given the user's plan is "Standard"
    When they view the Billing page
    Then an "Upgrade to Premium" button is rendered top-right of the "Plan & Billing" header row

  @AC-2
  Scenario: Upgrade CTA is hidden for a Premium-plan user
    Given the user's plan is "Premium"
    When they view the Billing page
    Then no "Upgrade to Premium" button is rendered

  @AC-3
  Scenario: Confirmation modal shows the exact prorated preview before commitment
    Given the user's plan is "Standard"
    And 15 days remain in the 30-day billing cycle
    When they click "Upgrade to Premium"
    Then the modal shows the title "Upgrade to Premium"
    And the modal shows "Remaining days: 15 days"
    And the modal shows a "Charge today" amount of "$10.00"
    And the modal lists the Premium highlights "4K Ultra HD", "4 simultaneous streams", "6 download devices", "Dolby Vision"
    And the user has not been charged or upgraded yet

  @AC-4
  Scenario: Cancel does nothing
    Given the confirmation modal is open
    When the user clicks "Cancel"
    Then no API call is made
    And the Billing page remains unchanged

  @AC-5
  Scenario: Successful prorated upgrade
    Given a user "A" exists with an active "Standard" subscription at "$20/month"
    And 15 days remain in the 30-day billing cycle
    When "A" requests an upgrade to "Premium" at "$40/month"
    Then a prorated charge of "$10.00" is calculated
    And "A"'s plan becomes "Premium"
    And "A"'s price becomes "$40/month"
    And "A"'s "renew_at" date is unchanged
    And the response is 200 with plan_name "Premium", price "$40/month", and prorated_charge 10.00
    And the response usages include video quality "4K Ultra HD", 4 simultaneous streams, and 6 download devices
    And the response included_usage includes a "Dolby Vision" perk alongside "Ad-free streaming" and "Spatial audio"

  @AC-5
  Scenario: Proration at the boundary — renewal date today
    Given a user "B" exists with an active "Standard" subscription at "$20/month"
    And 0 days remain in the billing cycle
    When "B" requests an upgrade to "Premium"
    Then a prorated charge of "$0.00" is calculated
    And "B"'s plan becomes "Premium"

  @AC-5
  Scenario: Proration at the boundary — full cycle remaining
    Given a user "C" exists with an active "Standard" subscription at "$20/month"
    And 30 days remain in the billing cycle
    When "C" requests an upgrade to "Premium"
    Then a prorated charge of "$20.00" is calculated

  @AC-6
  Scenario: Already-Premium guard
    Given a user "D" exists with an active "Premium" subscription at "$40/month"
    When "D" requests an upgrade to "Premium"
    Then the response is 400 with detail "Already on Premium plan"
    And "D"'s plan remains "Premium" with no further mutation

  @AC-7
  Scenario: Unknown-user guard
    Given no user exists with email "ghost@example.com"
    When an upgrade is requested for "ghost@example.com"
    Then the response is 401 with detail "Not authenticated"

  @AC-8
  Scenario: Billing page reflects Premium immediately, no reload
    Given the user's plan is "Standard"
    When the backend responds successfully to the confirm action
    Then the frontend updates its billing state directly from the response payload
    And no additional GET /api/billing request is made
    And the Upgrade to Premium button is no longer rendered

  @AC-9
  Scenario: Persistent post-upgrade success banner
    Given a successful upgrade just completed with a prorated charge of "$10.00" and 15 days remaining
    When the Billing page re-renders
    Then a success banner is shown reading "Upgraded to Premium — Charged $10.00 for the remaining 15 days of this billing cycle. From <renew_at> you will be billed $40/month."

  @AC-10
  Scenario: Confirmation modal shows an inline error on network failure
    Given the confirmation modal is open
    When the confirm action's network request fails
    Then the modal displays an inline error message
    And the user can retry or cancel
    And the existing GET /api/billing fetch's error handling is unchanged

  @AC-10
  Scenario: Confirmation modal shows an inline error on a 5xx response
    Given the confirmation modal is open
    When the confirm action receives a 500 response from the backend
    Then the modal displays an inline error message
    And the user can retry or cancel

  @AC-11
  Scenario: No regressions to existing flows
    Given a Standard-plan user who does not attempt an upgrade
    When they log in, register, restore a session, log out, or hit a protected route unauthenticated
    Then each flow behaves exactly as documented in the existing system (Flows 1-6)
    And the Standard-plan billing display is unchanged except for the new Upgrade CTA
