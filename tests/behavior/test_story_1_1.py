from pytest_bdd import scenarios

from .steps.billing_upgrade_steps import *  # noqa: F401,F403 -- step bindings

scenarios("../../spec/behavior/story-1.1.feature")
