Feature: Upgrade requests rejected for ineligible users
  Story 1.6 — backend only. The preview and upgrade endpoints refuse
  already-Premium and unknown accounts, and fail safely.

  Background:
    Given today is "Sep 25, 2026"
    And a Premium subscriber "priya@example.com" at "$40/month" renewing "Oct 30, 2026"

  @AC-1
  Scenario Outline: An already-Premium subscriber cannot be upgraded again
    When <request> is made for "priya@example.com"
    Then the response is 400 with detail "Already on Premium plan"
    And the billing data for "priya@example.com" still shows plan "Premium" at "$40/month"

    Examples:
      | request                  |
      | an upgrade preview       |
      | an upgrade request       |

  @AC-2
  Scenario Outline: An unknown account is not authenticated
    When <request> is made for "nobody@example.com"
    Then the response is 401 with detail "Not authenticated"
    And no billing data is created for "nobody@example.com"

    Examples:
      | request                  |
      | an upgrade preview       |
      | an upgrade request       |

  @AC-3
  Scenario Outline: An unexpected server error is returned as a generic failure
    Given the server hits an unexpected internal error while handling <request>
    When <request> is made for "priya@example.com"
    Then the response is 500 with a generic error message
    And the response contains no stack trace or internal detail
    And the error is recorded in the server log

    Examples:
      | request                  |
      | an upgrade preview       |
      | an upgrade request       |
