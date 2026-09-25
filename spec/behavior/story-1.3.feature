Feature: Billing page reflects the current plan
  Story 1.3 — frontend only. The badge, heading and cards follow the
  plan in the billing data instead of a hardcoded "Standard".

  @AC-1
  Scenario: A Premium subscriber's page names Premium
    Given the subscriber's billing data has plan "Premium" at "$40/month" renewing "Oct 30, 2026"
    And the billing data lists video quality "4K Ultra HD", "Can watch on 4 devices at once" and "Can download on 6 devices"
    And the billing data lists the perks "Ad-free streaming", "Spatial audio (select titles)" and "Dolby Vision (select titles)"
    When the Billing page loads
    Then the "Current plan:" badge reads "Premium"
    And the heading reads "What's included with Premium"
    And the monthly plan card shows "$40/month"
    And the feature cards show "4K Ultra HD", "Can watch on 4 devices at once" and "Can download on 6 devices"
    And the Plan perks card lists "Ad-free streaming", "Spatial audio (select titles)" and "Dolby Vision (select titles)"

  @AC-2
  Scenario: The seeded Standard subscriber's page is unchanged
    Given "tpg@example.com" logs in with password "password"
    When the Billing page loads
    Then the "Current plan:" badge reads "Standard"
    And the heading reads "What's included with Standard"
    And the monthly plan card shows "$20/month"
    And the renewal card shows "Oct 30, 2026"
    And the feature cards show "Full HD (1080p)", "Can watch on 2 devices at once" and "Can download on 2 devices"
