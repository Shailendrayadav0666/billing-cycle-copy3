Feature: Mid-Cycle Subscription Upgrade (Standard -> Premium)

  Background:
    Given a subscriber "sam@example.com" exists with an active "Standard" subscription at $20/month
    And 15 days remain in the current 30-day billing cycle
    And a subscriber "priya@example.com" exists with an active "Premium" subscription at $40/month
    And a subscriber "fail@example.com" exists with an active "Standard" subscription at $20/month

  @AC-1
  Scenario: Billing page shows the real plan name, not a hardcoded label
    When "sam@example.com" opens the Billing page
    Then the current-plan badge shows "Standard"
    And no hardcoded "Standard" text is rendered independent of the API response

  @AC-2
  Scenario: Plan card shows the real price and Active badge
    When "sam@example.com" opens the Billing page
    Then the plan card shows the price "$20/month"
    And the plan card shows an "Active" badge

  @AC-3
  Scenario: Upgrade CTA appears for a Standard subscriber
    When "sam@example.com" opens the Billing page
    Then an "Upgrade to Premium" button is visible

  @AC-3
  Scenario: Upgrade CTA is absent for a Premium subscriber
    When "priya@example.com" opens the Billing page
    Then no "Upgrade to Premium" button is visible

  @AC-4
  Scenario: Upgrade CTA has stable, automation-friendly text
    When "sam@example.com" opens the Billing page
    Then the "Upgrade to Premium" button text is exactly "Upgrade to Premium"

  @AC-5 @AC-6
  Scenario: Upgrade preview computes the correct prorated charge for a Standard subscriber
    When "sam@example.com" requests an upgrade preview with 15 days remaining
    Then the preview response is 200
    And the preview shows current plan "Standard" and new plan "Premium"
    And the preview shows a prorated charge of $10.00
    And the preview shows a next renewal price of $40.00

  @AC-7
  Scenario: Upgrade preview is blocked for an already-Premium subscriber
    When "priya@example.com" requests an upgrade preview
    Then the preview response is 409 with detail "already_premium"

  @AC-8
  Scenario: Upgrade preview rejects an unknown email
    When an unauthenticated request requests an upgrade preview for "nobody@example.com"
    Then the preview response is 401 with detail "Not authenticated"

  @AC-9
  Scenario: Clicking the CTA opens the confirmation modal and loads the preview
    Given "sam@example.com" is on the Billing page
    When "sam@example.com" clicks "Upgrade to Premium"
    Then the upgrade confirmation modal opens
    And the modal displays the fetched preview values

  @AC-10
  Scenario: Confirmation modal displays every required field verbatim
    Given "sam@example.com" has opened the upgrade confirmation modal
    Then the modal shows "Standard ($20/mo)" as the current plan
    And the modal shows "Premium ($40/mo)" as the new plan
    And the modal shows "15" as the days remaining
    And the modal shows "You will be charged $10.00 today"
    And the modal shows "$40.00/month starting" followed by the renewal date

  @AC-11
  Scenario: Cancel closes the modal with no side effects
    Given "sam@example.com" has opened the upgrade confirmation modal
    When "sam@example.com" clicks "Cancel"
    Then the modal closes
    And "sam@example.com"'s plan remains "Standard"
    And no upgrade request was sent

  @AC-12
  Scenario: The displayed prorated charge matches the API response exactly
    Given "sam@example.com" has opened the upgrade confirmation modal
    Then the displayed charge is exactly the value the preview API returned, with no client-side recalculation

  @AC-13 @AC-14
  Scenario: Confirming the upgrade with a valid card flips the plan to Premium
    Given "sam@example.com" has opened the upgrade confirmation modal
    When "sam@example.com" clicks "Confirm Upgrade"
    Then the upgrade response is 200 with status "success", plan "Premium", and charge 10.00
    And "sam@example.com"'s plan becomes "Premium"
    And "sam@example.com"'s price becomes "$40/month"
    And "sam@example.com"'s renew_at date is unchanged

  @AC-15
  Scenario: A successful upgrade sets Premium-tier quotas
    Given "sam@example.com" has just upgraded to "Premium"
    Then the chat credits quota total is 10000
    And the chatbots quota total is 10
    And the documents pages quota total is 5000
    And the on-demand usage notice reads "On-demand credit is available on your Premium plan."

  @AC-16
  Scenario: Confirming an upgrade is blocked for an already-Premium subscriber
    When "priya@example.com" sends an upgrade request
    Then the upgrade response is 409 with detail "already_premium"
    And no charge is attempted

  @AC-17
  Scenario: Confirming an upgrade rejects an unknown email
    When an unauthenticated request sends an upgrade request for "nobody@example.com"
    Then the upgrade response is 401 with detail "Not authenticated"

  @AC-13 @AC-18
  Scenario: Confirming the upgrade with a declined card returns a clear error
    Given "fail@example.com" has opened the upgrade confirmation modal
    When "fail@example.com" clicks "Confirm Upgrade"
    Then the upgrade response is 402 with detail "card_declined" and message "Your card was declined."

  @AC-19
  Scenario: A declined card leaves the subscriber's data completely unchanged
    Given "fail@example.com" has opened the upgrade confirmation modal
    When "fail@example.com" clicks "Confirm Upgrade" and the card is declined
    Then "fail@example.com"'s plan remains "Standard"
    And "fail@example.com"'s price remains "$20/month"
    And "fail@example.com"'s usages are byte-for-byte unchanged

  @AC-20
  Scenario: Confirm Upgrade calls the upgrade endpoint with the subscriber's email
    Given "sam@example.com" has opened the upgrade confirmation modal
    When "sam@example.com" clicks "Confirm Upgrade"
    Then a POST request is sent to "/api/billing/upgrade" with email "sam@example.com"

  @AC-21
  Scenario: A successful upgrade refreshes the Billing page and hides the CTA
    Given "sam@example.com" has just upgraded to "Premium"
    When the Billing page re-fetches billing data
    Then the upgrade confirmation modal is closed
    And no "Upgrade to Premium" button is visible

  @AC-22
  Scenario: A successful upgrade shows the exact amount charged
    Given "sam@example.com" has just upgraded to "Premium" for a charge of $10.00
    Then a success banner reads "You're now on Premium! $10.00 was charged."

  @AC-23
  Scenario: A declined payment keeps the modal open
    Given "fail@example.com" has confirmed an upgrade that was declined
    Then the upgrade confirmation modal is still open

  @AC-24
  Scenario: A declined payment shows the inline error message
    Given "fail@example.com" has confirmed an upgrade that was declined
    Then the modal shows the inline error "Payment failed: Your card was declined. Your plan has not changed."

  @AC-25
  Scenario: A declined payment leaves Cancel available and the plan on Standard
    Given "fail@example.com" has confirmed an upgrade that was declined
    When "fail@example.com" clicks "Cancel"
    Then the modal closes
    And the Billing page still shows the plan "Standard"
