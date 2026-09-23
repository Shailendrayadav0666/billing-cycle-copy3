Feature: Prorated Upgrade Endpoint (Story 1.2)

  Background:
    Given a user "TPG" exists with email "tpg@example.com"
    And "TPG" has an active "Standard" subscription at $20/month, renewing on "Oct 30, 2026"

  @AC-1
  Scenario Outline: Successful upgrade computes the correct prorated charge and preserves the renew date
    Given <days_remaining> days remain in the 30-day billing cycle
    When a "POST /api/billing/upgrade" request is made with email "tpg@example.com"
    Then the response has a 2xx status
    And the response reports a prorated charge of <charge>
    And "TPG"'s plan becomes "Premium" at "$40/month"
    And "TPG"'s renew_at date remains "Oct 30, 2026"

    Examples:
      | days_remaining | charge  |
      | 15              | $10.00  |
      | 1               | $0.67   |
      | 30              | $20.00  |

  @AC-2
  Scenario: Upgrading with an unknown email is rejected with no state change
    When a "POST /api/billing/upgrade" request is made with email "nobody@example.com"
    Then the response has a 404-class status
    And no user or billing record is created or modified

  @AC-3
  Scenario: Upgrading a user who is already on Premium is rejected with no state change
    Given "TPG" has already upgraded to the "Premium" plan
    When a "POST /api/billing/upgrade" request is made with email "tpg@example.com"
    Then the response has a 4xx-class status
    And "TPG"'s plan remains "Premium" with no additional charge applied

  @AC-4
  Scenario Outline: The prorated-charge calculation is correct in isolation for a range of inputs
    Given a proration calculation with standard_price=20, premium_price=40, days_in_cycle=30, and days_remaining=<days_remaining>
    Then the computed charge is <charge>

    Examples:
      | days_remaining | charge  |
      | 0               | $0.00   |
      | 15              | $10.00  |
      | 29              | $19.33  |
      | 30              | $20.00  |

  @AC-5
  Scenario: Existing endpoints are unaffected by the new upgrade endpoint
    When "GET /api/billing" is called with email "tpg@example.com"
    Then the response matches the same shape and values as before this endpoint was added
    When "GET /api/users/me" is called with email "tpg@example.com"
    Then the response matches the same shape and values as before this endpoint was added
