"""Behaviour Gate — Story 1.1 (Mid-Cycle Subscription Upgrade). Tier B1 for this work unit."""
from steps.billing_steps import *  # noqa: F401,F403 - registers the step definitions
from pytest_bdd import scenarios

scenarios("../../spec/behavior/story-1.1.feature")
