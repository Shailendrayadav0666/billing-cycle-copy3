Feature: Dialog shows the server-computed prorated charge
  Story 1.7 — frontend only. When the dialog opens it fetches the preview
  and shows the days and charge exactly as the server returned them.

  Background:
    Given the subscriber's billing data has plan "Standard" at "$20/month"

  @AC-1
  Scenario: Opening the dialog requests the preview and shows a loading state
    Given the upgrade preview has not responded yet
    When the subscriber clicks "Upgrade to Premium"
    Then an upgrade preview is requested for the subscriber
    And the dialog's summary shows a loading state
    And no "Confirm & pay" button is available

  @AC-2
  Scenario: The dialog shows the remaining days and today's charge
    Given the upgrade preview returns 15 days remaining and a prorated charge of 10.0
    When the subscriber clicks "Upgrade to Premium"
    Then the dialog shows "Remaining days" as "15 days"
    And the dialog shows "Charge today" as "$10.00"
    And a "Confirm & pay $10.00" button is shown beside "Cancel"

  @AC-3
  Scenario Outline: The dialog displays the server's values without recalculating
    Given the upgrade preview returns <days> days remaining and a prorated charge of <charge>
    When the subscriber clicks "Upgrade to Premium"
    Then the dialog shows "Remaining days" as "<days> days"
    And the dialog shows "Charge today" as "<shown>"

    Examples:
      | days | charge | shown  |
      | 30   | 20     | $20.00 |
      | 29   | 19.33  | $19.33 |
      | 0    | 0      | $0.00  |
