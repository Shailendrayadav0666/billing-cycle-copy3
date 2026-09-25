# Integration Test Steps — Story 1.8: Confirm the upgrade from the dialog

**Purpose**: verify the boundary between the dialog's "Confirm & pay" action and the backend upgrade endpoint (`POST /api/billing/upgrade`, `spec/plans/architecture.md` Section 5): one request, the right body, and the page updated from the server's response.
**Scope**: AC-1, AC-2 of Story 1.8. Observation through the browser DevTools Network tab (black-box).

## System Under Test
| Item | Value |
|------|-------|
| Branch | `epic/4702-self-serve-premium-upgrade` |
| This story's PR | TO CONFIRM — the Story 1.8 `[STORY]` PR once raised and merged into the epic branch |
| Confirm the story is in the build | `git log --oneline \| grep "1.8"` |
| How to build & run it | **Follow the project's own build docs** (README / CONTRIBUTING / Makefile). This plan does not restate them. |
| Local base URL / port | Frontend: TO CONFIRM. Backend API: TO CONFIRM |
| Local services that must be up | Backend API and frontend, both running locally; no datastore |
| Test data / accounts to seed | Seeded account `tpg@example.com` / `password` — Standard, renews Oct 30, 2026. Restart the backend to reset an upgraded account. |

> If the build or local run fails, that is a **blocker on the dev team** — report it and do not log
> functional failures against a system that never started.

---

### TC-INT-01 — Confirm sends exactly one upgrade request with the account's email

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-F-10 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; DevTools Network tab open, "Preserve log" on, log cleared |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in, open the dialog, wait for the charge.
2. Clear the Network log.
3. Click "Confirm & pay $X" once.
4. Inspect the requests.

**Expected result**
- Exactly one `POST` to `/api/billing/upgrade`.
- Its JSON body is `{"email": "tpg@example.com"}` — no plan, price or charge fields.
- The response is 200 with `plan_name` "Premium", `price` "$40/month", the unchanged `renew_at`, and `prorated_charge` / `days_remaining`.

**Pass/Fail criteria**: PASS if one POST with only the email is sent and returns 200. FAIL otherwise.
**Cleanup**: Restart the backend.

### TC-INT-02 — A double click sends no second request and shows a pending state

| Field | Value |
|-------|-------|
| **Traces to** | AC-1 / REQ-NF-03 |
| **Type** | Integration |
| **Priority** | P1 |
| **Preconditions** | Backend freshly started; DevTools network throttling set to a very slow profile; Network log cleared |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in, open the dialog, wait for the charge (keep throttling on).
2. Click "Confirm & pay $X" twice in quick succession, then try a third click while the request is pending.
3. Observe the button and the Network log until the request completes.
4. Remove throttling.

**Expected result**
- While the request is pending, the "Confirm & pay" button is disabled and shows a pending state.
- Only one `POST /api/billing/upgrade` appears in the Network log.

**Pass/Fail criteria**: PASS if exactly one POST is sent and the button is disabled with a pending indicator during the request. FAIL if a second POST is sent or the button stays active.
**Cleanup**: Restart the backend; remove throttling.

### TC-INT-03 — The page is updated from the server response, not from assumed values

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-10 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | Backend freshly started; DevTools Network tab open |
| **Test data** | `tpg@example.com` / `password` |

**Steps**
1. Log in, open the dialog and confirm.
2. In the Network log, open the `POST /api/billing/upgrade` response.
3. Compare every value shown on the page with the response.
4. Check the Network log for any other requests made after the POST.

**Expected result**
- The badge, price, renewal date, feature card values and perks shown equal the response's `plan_name`, `price`, `renew_at`, `usages` and `included_usage`.
- No full page (document) reload request occurs.

**Pass/Fail criteria**: PASS if the page matches the response and no reload occurs. FAIL on any mismatch.
**Cleanup**: Restart the backend.

### TC-INT-04 — Backend state agrees with the page after confirming

| Field | Value |
|-------|-------|
| **Traces to** | AC-2 / REQ-F-05, REQ-F-06 |
| **Type** | Integration |
| **Priority** | P2 |
| **Preconditions** | TC-INT-03 completed (upgraded; backend still running) |
| **Test data** | `tpg@example.com` |

**Steps**
1. In a new browser tab, open `<backend base URL>/api/billing?email=tpg@example.com` (base URL TO CONFIRM).
2. In another tab, open `<backend base URL>/api/users/me?email=tpg@example.com`.

**Expected result**
- `/api/billing` returns `plan_name` "Premium", `price` "$40/month", `renew_at` "Oct 30, 2026".
- `/api/users/me` returns `plan` "Premium", `price` "$40/month", `renew_at` "Oct 30, 2026", and no password field.

**Pass/Fail criteria**: PASS if both endpoints agree with the page. FAIL otherwise.
**Cleanup**: Restart the backend.
