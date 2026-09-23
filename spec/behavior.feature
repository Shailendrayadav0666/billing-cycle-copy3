Feature: Self-Serve Premium Upgrade — end to end

  Background:
    Given a user "TPG" exists with email "tpg@example.com"
    And "TPG" has an active "Standard" subscription at $20/month
    And 15 days remain in the 30-day billing cycle, renewing on "Oct 30, 2026"

  @REQ-F-01 @REQ-F-02 @REQ-F-03 @REQ-F-04 @REQ-F-05 @REQ-F-06 @REQ-F-07 @REQ-F-08 @REQ-F-09
  Scenario: A Standard subscriber upgrades to Premium and sees it reflected immediately
    Given "TPG" is viewing the Billing page                                   # story 1.1
    When "TPG" clicks "Upgrade to Premium"                                    # story 1.1
    Then a confirmation modal shows a prorated charge of $10.00 and "15 days" remaining   # story 1.1
    When "TPG" clicks "Confirm & pay $10.00"                                  # story 1.1 -> story 1.2
    Then the backend applies the upgrade, returns plan "Premium" at $40/month, renew date unchanged   # story 1.2
    And the Billing page immediately shows "Current plan: Premium" and "$40/month"        # story 1.3
    And a success banner reports "Charged $10.00 for the remaining 15 days of this billing cycle. From Oct 30, 2026 you will be billed $40/month."   # story 1.3
    And the "Upgrade to Premium" CTA is no longer shown                       # story 1.3

  @REQ-F-10
  Scenario: A failed upgrade attempt does not change the plan and allows retry
    Given "TPG" is viewing the Billing page                                   # story 1.1
    When "TPG" clicks "Upgrade to Premium" and then "Confirm & pay $10.00"    # story 1.1
    And the upgrade request fails                                            # story 1.2 (simulated failure)
    Then the modal remains open with an inline error message                 # story 1.4
    And the "Confirm & pay $10.00" button is re-enabled                      # story 1.4
    And "TPG" still shows "Current plan: Standard" at "$20/month"             # story 1.4
    When "TPG" clicks "Confirm & pay $10.00" again and the request succeeds  # story 1.2
    Then the Billing page immediately shows "Current plan: Premium" and "$40/month"       # story 1.3

  @REQ-F-08
  Scenario: An already-Premium subscriber cannot be upgraded again
    Given "TPG" has already upgraded to the "Premium" plan
    When a POST /api/billing/upgrade request is made for "TPG"'s email       # story 1.2
    Then the request is rejected with no change to "TPG"'s billing record    # story 1.2
