Feature: Premium upgrade dialog on the Billing page
  Story 1.1 — frontend only. The dialog shell: CTA, plan comparison,
  Premium benefits and dismissal. No upgrade can be triggered yet.

  Background:
    Given the Billing page is rendered for a logged-in subscriber

  @AC-1
  Scenario: A Standard subscriber sees the Upgrade to Premium button
    Given the subscriber's billing data has plan "Standard" at "$20/month"
    When the Billing page loads
    Then an "Upgrade to Premium" button is shown in the "Plan & Billing" title row

  @AC-2
  Scenario: A Premium subscriber is not offered an upgrade
    Given the subscriber's billing data has plan "Premium" at "$40/month"
    When the Billing page loads
    Then no "Upgrade to Premium" button is shown

  @AC-3
  Scenario: Opening the dialog shows the plan comparison and Premium benefits
    Given the subscriber's billing data has plan "Standard" at "$20/month"
    When the subscriber clicks "Upgrade to Premium"
    Then a dialog titled "Upgrade to Premium" is shown over the page
    And the dialog reads "Premium is $40/month. You'll be charged a prorated amount for the rest of this cycle."
    And the dialog shows "Current plan" as "Standard ($20/mo)"
    And the dialog shows "New plan" as "Premium ($40/mo)"
    And the dialog lists the benefits "4K Ultra HD video quality", "Stream on 4 devices at once", "Download on 6 devices" and "Dolby Vision (select titles)"
    And the dialog shows a "Cancel" button
    And no request has been sent to any upgrade endpoint

  @AC-4
  Scenario Outline: Dismissing the dialog leaves the page unchanged
    Given the subscriber has opened the upgrade dialog
    When the subscriber dismisses it by <action>
    Then the dialog is closed
    And the Billing page still shows plan "Standard" at "$20/month"
    And no request has been sent to any upgrade endpoint

    Examples:
      | action                   |
      | clicking "Cancel"        |
      | pressing Escape          |
      | clicking the backdrop    |

  @AC-5
  Scenario: The dialog is accessible from the keyboard
    Given the subscriber's billing data has plan "Standard" at "$20/month"
    When the subscriber activates "Upgrade to Premium" with the keyboard
    Then the dialog has role "dialog" and is marked as modal
    And the dialog is labelled "Upgrade to Premium"
    And keyboard focus is inside the dialog
    When the subscriber presses Escape
    Then keyboard focus returns to the "Upgrade to Premium" button
