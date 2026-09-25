Feature: Prorated charge calculation
  Story 1.2 — backend only. The one function that turns a renewal date
  into billable days and a prorated Standard-to-Premium charge.

  Background:
    Given the Standard price is $20.00 and the Premium price is $40.00
    And the billing cycle is 30 days
    And today is "Sep 25, 2026"

  @AC-1
  Scenario Outline: Mid-cycle charge for the days left
    Given the renewal date is <renew_at>
    When the prorated charge is calculated
    Then the billable days are <days>
    And the prorated charge is <charge>

    Examples:
      | renew_at       | days | charge |
      | "Oct 10, 2026" | 15   | $10.00 |
      | "Oct 24, 2026" | 29   | $19.33 |

  @AC-2
  Scenario Outline: Renewal today or in the past costs nothing
    Given the renewal date is <renew_at>
    When the prorated charge is calculated
    Then the billable days are 0
    And the prorated charge is $0.00

    Examples:
      | renew_at       |
      | "Sep 25, 2026" |
      | "Sep 01, 2026" |

  @AC-3
  Scenario Outline: The charge is capped at one full cycle
    Given the renewal date is <renew_at>
    When the prorated charge is calculated
    Then the billable days are 30
    And the prorated charge is $20.00

    Examples:
      | renew_at       |
      | "Oct 25, 2026" |
      | "Oct 30, 2026" |

  @AC-4
  Scenario: The stored renewal date format is read correctly
    Given the renewal date is stored as the text "Oct 30, 2026"
    When the prorated charge is calculated
    Then the renewal date is read as 30 October 2026
    And the billable days are 30
    And the prorated charge is $20.00
