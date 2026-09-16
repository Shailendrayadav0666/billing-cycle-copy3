Feature: Prorated Upgrade Endpoint

  Background:
    Given a user "tpg@example.com" exists with plan "Standard" at $20/month
    And the user's billing cycle renews in 15 days

  @AC-1
  Scenario: Preview returns the prorated charge without mutating state
    When a dry_run upgrade preview is requested for "tpg@example.com"
    Then the response is 200 with a prorated charge of $10.00
    And the user's plan remains "Standard"

  @AC-2
  Scenario: Confirming the upgrade applies it and returns the applied charge
    When the upgrade is applied for "tpg@example.com"
    Then the response is 200 with an applied charge of $10.00
    And the user's plan becomes "Premium"

  @AC-3
  Scenario: An already-Premium account cannot be upgraded again
    Given "tpg@example.com" has already been upgraded to "Premium"
    When the upgrade is applied again for "tpg@example.com"
    Then the response is 400
    And the user's plan remains "Premium" with no duplicate charge

  @AC-4
  Scenario: An unknown account cannot preview or apply an upgrade
    When the upgrade is requested for an email not in the system
    Then the response is 401

  @AC-4
  Scenario: A malformed request is rejected before any business logic runs
    When the upgrade endpoint is called with no email field
    Then the response is a validation error

  @AC-2
  Scenario: The on-demand balance is unchanged by the upgrade
    Given "tpg@example.com" has an on-demand balance of $18.00
    When the upgrade is applied for "tpg@example.com"
    Then the on-demand balance is still $18.00
