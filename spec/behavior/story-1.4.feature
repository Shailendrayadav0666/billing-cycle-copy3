Feature: Upgrade preview endpoint
  Story 1.4 — backend only. GET /api/billing/upgrade-preview returns the
  charge a Standard subscriber would pay, without changing anything.

  Background:
    Given today is "Sep 25, 2026"
    And a Standard subscriber "sam@example.com" at "$20/month" renewing "Oct 10, 2026"

  @AC-1
  Scenario: A Standard subscriber previews the prorated upgrade
    When an upgrade preview is requested for "sam@example.com"
    Then the response is 200
    And the preview shows current plan "Standard" at "$20/month"
    And the preview shows new plan "Premium" at "$40/month"
    And the preview shows 15 days remaining of a 30-day cycle
    And the preview shows a prorated charge of 10.00

  @AC-2
  Scenario: Previewing does not change the subscription
    When an upgrade preview is requested for "sam@example.com"
    Then the billing data for "sam@example.com" still shows plan "Standard" at "$20/month"
    And the renewal date for "sam@example.com" is still "Oct 10, 2026"

  @AC-3
  Scenario Outline: Malformed preview requests are rejected safely
    When an upgrade preview is requested with <email_param>
    Then the response is a 4xx validation error
    And the response contains no stack trace or internal detail

    Examples:
      | email_param             |
      | no email parameter      |
      | the email "not-an-email" |
