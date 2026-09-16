Feature: Self-serve mid-cycle Premium upgrade — end to end

  Background:
    Given a user "maria@example.com" exists on the "STANDARD" plan at $20/month
    And 15 days remain in the current 30-day billing cycle
    And the Premium plan costs $40/month

  @REQ-F-01 @REQ-F-02 @REQ-F-03 @REQ-F-04 @REQ-F-06 @REQ-F-07
  Scenario: A Standard subscriber previews, confirms and lands on Premium, all from the Billing page
    Given "maria@example.com" is on the Billing page
    When she clicks "Upgrade to Premium"
    Then she sees a prorated charge preview of $10.00
    When she confirms the upgrade
    Then her plan becomes "PREMIUM"
    And her on-demand credit balance is unchanged from before the upgrade
    And the Billing page shows the Premium plan badge and Premium usage limits without a page reload

  @REQ-F-05
  Scenario: An already-Premium account cannot be idempotency-tricked into re-upgrading
    Given "maria@example.com" has already completed the upgrade to "PREMIUM"
    When a call is made to apply the upgrade again for "maria@example.com"
    Then the response is 400
    And her plan remains "PREMIUM" with no duplicate charge applied
