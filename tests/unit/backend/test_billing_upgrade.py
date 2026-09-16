"""Unit tests for the proration business logic (Story 1.1).

Pure function tests — no HTTP client, no TestClient. Exercises `_prorated_charge` and the
`PLAN_CATALOG`/`CYCLE_LENGTH_DAYS` constants directly. API-level behaviour (auth, idempotency,
request/response contract) is covered separately in tests/api/test_billing_upgrade_api.py, per
common/directory-structure.md rule 4b (API & Contract tests never live under tests/unit/).
"""

from datetime import datetime, timedelta

import pytest

import main


def _renew_at(days_from_now: int) -> str:
    return (datetime.today() + timedelta(days=days_from_now)).strftime("%b %d, %Y")


class TestProratedCharge:
    def test_full_cycle_remaining_charges_full_price_delta(self):
        # 30 days remaining -> the full $20 Standard->Premium delta
        charge = main._prorated_charge("Standard", "Premium", _renew_at(30))
        assert charge == 20.00

    def test_mid_cycle_matches_epic_worked_example(self):
        # Epic worked example: 15 days remaining -> $10.00 prorated charge
        charge = main._prorated_charge("Standard", "Premium", _renew_at(15))
        assert charge == 10.00

    def test_zero_days_remaining_charges_nothing(self):
        charge = main._prorated_charge("Standard", "Premium", _renew_at(0))
        assert charge == 0.00

    def test_negative_days_remaining_is_clamped_to_zero(self):
        # renew_at already in the past -> clamp to 0, never a negative charge
        charge = main._prorated_charge("Standard", "Premium", _renew_at(-5))
        assert charge == 0.00

    def test_days_remaining_beyond_cycle_length_is_clamped(self):
        # A renew_at further out than CYCLE_LENGTH_DAYS is clamped to the full cycle, never > full price
        charge = main._prorated_charge("Standard", "Premium", _renew_at(45))
        assert charge == 20.00

    def test_single_cycle_length_constant_used_throughout(self):
        # ARCH-06 / REQ-NF-06: exactly one named constant for the cycle length
        assert main.CYCLE_LENGTH_DAYS == 30


class TestPlanCatalog:
    def test_standard_and_premium_prices_match_epic(self):
        assert main.PLAN_CATALOG["Standard"]["price"] == 20.0
        assert main.PLAN_CATALOG["Premium"]["price"] == 40.0

    def test_premium_limits_are_higher_than_standard(self):
        std = main.PLAN_CATALOG["Standard"]["limits"]
        prem = main.PLAN_CATALOG["Premium"]["limits"]
        for key in std:
            assert prem[key] > std[key]
