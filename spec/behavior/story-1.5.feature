Feature: Upgrade endpoint switches the user to Premium
  Story 1.5 — backend only. POST /api/billing/upgrade applies the upgrade,
  recomputing the charge on the server, and keeps the renewal date.

  Background:
    Given today is "Sep 25, 2026"
    And a Standard subscriber "sam@example.com" at "$20/month" renewing "Oct 10, 2026"
    And a Standard subscriber "tpg@example.com" at "$20/month" renewing "Oct 30, 2026"

  @AC-1
  Scenario: A Standard subscriber is upgraded to Premium
    When an upgrade is requested for "sam@example.com"
    Then the response is 200
    And the response shows plan "Premium" at "$40/month" renewing "Oct 10, 2026"
    And the response lists video quality "4K Ultra HD", "Can watch on 4 devices at once" and "Can download on 6 devices"
    And the response lists the perks "Ad-free streaming", "Spatial audio (select titles)" and "Dolby Vision (select titles)"
    And the response shows a prorated charge of 10.00 for 15 days remaining

  @AC-2
  Scenario: The upgrade is kept for that subscriber only
    Given an upgrade was requested for "sam@example.com"
    When the billing data and profile for "sam@example.com" are fetched
    Then both show plan "Premium" at "$40/month"
    And the billing data for "tpg@example.com" still shows plan "Standard" at "$20/month"

  @AC-3
  Scenario: The renewal date does not move
    When an upgrade is requested for "tpg@example.com"
    Then the response shows renewal date "Oct 30, 2026"
    And the stored renewal date for "tpg@example.com" is still "Oct 30, 2026"
    And the billing data for "tpg@example.com" shows renewal date "Oct 30, 2026"

  @AC-4
  Scenario: Client-supplied plan, price or charge values are ignored
    When an upgrade is requested for "sam@example.com" with extra fields plan "Enterprise", price "$1/month" and prorated_charge 0.01
    Then the subscriber's plan is "Premium" at "$40/month"
    And the response shows a prorated charge of 10.00
    And the upgrade attempt and its outcome are logged without any password
