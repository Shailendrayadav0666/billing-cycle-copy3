Feature: Upgrade failures shown in the dialog
  Story 1.9 — frontend only. A failed preview or upgrade keeps the dialog
  open with an announced error and leaves the page untouched.

  Background:
    Given the subscriber's billing data has plan "Standard" at "$20/month"
    And the subscriber has opened the upgrade dialog

  @AC-1
  Scenario: A rejected upgrade shows the server's reason
    Given the dialog shows "Confirm & pay $10.00"
    And the upgrade request will be rejected with 400 and detail "Already on Premium plan"
    When the subscriber clicks "Confirm & pay $10.00"
    Then the dialog stays open
    And an alert in the dialog reads "Already on Premium plan"
    And the "Confirm & pay $10.00" button is enabled again
    And the Billing page still shows plan "Standard" at "$20/month"

  @AC-2
  Scenario Outline: A network or server failure shows a generic error
    Given the dialog shows "Confirm & pay $10.00"
    And the upgrade request will fail with <failure>
    When the subscriber clicks "Confirm & pay $10.00"
    Then the dialog stays open
    And an alert in the dialog reads "We couldn't complete your upgrade. Please try again."
    And the "Confirm & pay $10.00" button is enabled again
    And the Billing page still shows plan "Standard" at "$20/month"

    Examples:
      | failure            |
      | a 401 response     |
      | a 500 response     |
      | a network error    |

  @AC-3
  Scenario: A failed preview hides the charge and the confirm button
    Given the upgrade preview request fails
    When the dialog finishes loading
    Then an alert in the dialog explains the charge could not be loaded
    And no "Remaining days" or "Charge today" rows are shown
    And no "Confirm & pay" button is available
