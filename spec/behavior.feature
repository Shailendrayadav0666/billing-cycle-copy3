# Cycle-level journeys for Epic 4702 — Self-Serve Premium Upgrade.
# Only journeys that span several stories live here; each story's own
# acceptance criteria are in spec/behavior/story-<N.M>.feature.
# Runs as tier B3 on the last work unit of the cycle.

Feature: Self-serve Premium upgrade — end to end

  Background:
    Given today is "Sep 25, 2026"
    And the backend is running with its seeded in-memory data

  @REQ-F-02 @REQ-F-03 @REQ-F-04 @REQ-F-05 @REQ-F-06 @REQ-F-07 @REQ-F-08 @REQ-F-09 @REQ-F-10 @REQ-F-11
  Scenario: The seeded Standard subscriber upgrades mid-cycle and keeps Premium after a reload
    Given "tpg@example.com" logs in with password "password"
    And the Billing page shows the plan "Standard" at "$20/month" renewing "Oct 30, 2026"
    When they open the upgrade dialog from "Upgrade to Premium"
    Then the dialog shows "Remaining days" of "30 days"
    And the dialog shows "Charge today" of "$20.00"
    When they choose "Confirm & pay $20.00"
    Then the Billing page shows the plan "Premium" at "$40/month" renewing "Oct 30, 2026" without a page reload
    And the confirmation panel reads "Charged $20.00 for the remaining 30 days of this billing cycle. From Oct 30, 2026 you will be billed $40/month."
    And no "Upgrade to Premium" button is shown
    When they reload the Billing page
    Then the Billing page still shows the plan "Premium" at "$40/month" renewing "Oct 30, 2026"
    And no confirmation panel is shown

  @REQ-F-02 @REQ-F-04 @REQ-F-14
  Scenario: A newly registered subscriber can upgrade and is charged for a full cycle
    Given a new user registers as "Nina" with email "nina@example.com"
    Then the Billing page shows the plan "Standard" at "$20/month" renewing "Oct 25, 2026"
    When they upgrade to Premium from the Billing page
    Then they are charged "$20.00" for "30" remaining days
    And the Billing page shows the plan "Premium" at "$40/month"

  @REQ-F-03 @REQ-F-04 @REQ-F-12
  Scenario: After upgrading, the same account cannot be upgraded again
    Given "tpg@example.com" has upgraded to Premium
    When an upgrade preview is requested for "tpg@example.com"
    Then the response is 400 with detail "Already on Premium plan"
    When an upgrade is requested for "tpg@example.com"
    Then the response is 400 with detail "Already on Premium plan"
    And the plan for "tpg@example.com" is still "Premium" at "$40/month"
