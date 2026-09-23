// Shared Gherkin step definitions bound to the application's public surface:
// the rendered <Billing /> React component (its actual DOM output), never internals.
const assert = require('node:assert/strict')
const { Given, When, Then, Before, After } = require('@cucumber/cucumber')
const React = require('react')
const { render, screen, cleanup, waitFor } = require('@testing-library/react')
const userEvent = require('@testing-library/user-event').default
const FakeTimers = require('@sinonjs/fake-timers')

// Substitute the AuthContext module in Node's require cache BEFORE Billing.jsx is required,
// so Billing's own `import { useAuth } from '../context/AuthContext'` resolves to this
// controllable fake instead of the real context (which needs a live Provider + router to
// bind a token). This keeps the test bound to Billing's actual rendered output — its real
// public surface — substituting only the one upstream dependency (auth identity) that this
// story's scope does not cover.
let currentEmail = null
const authContextPath = require.resolve('../../../src/frontend/src/context/AuthContext')
require.cache[authContextPath] = {
  id: authContextPath,
  filename: authContextPath,
  loaded: true,
  exports: { useAuth: () => ({ token: currentEmail }) },
}

const Billing = require('../../../src/frontend/src/pages/Billing').default

Before(function () {
  this.world = {}
  this.fetchCalls = []
  global.fetch = (url, options) => {
    this.fetchCalls.push({ url: String(url), options })
    if (String(url).includes('/api/billing/upgrade')) {
      return this.world.upgradePromise || new Promise(() => {}) // never resolves unless the scenario supplies one
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(this.world.billingData),
    })
  }
})

After(function () {
  cleanup()
  currentEmail = null
  delete global.fetch
  if (this.clock) this.clock.uninstall()
})

Given('a user {string} exists with email {string}', function (name, email) {
  this.world.userName = name
  this.world.email = email
  currentEmail = email
})

Given(/^"([^"]+)" has an active "([^"]+)" subscription at \$(\d+)\/month$/, function (name, plan, price) {
  this.world.planName = plan
  this.world.price = `$${price}/month`
})

Given(/^(\d+) days remain in the 30-day billing cycle, renewing on "([^"]+)"$/, function (days, renewAt) {
  this.world.remainingDays = Number(days)
  this.world.renewAt = renewAt
})

Given('{string} is viewing the Billing page', async function (name) {
  this.world.billingData = {
    plan_name: this.world.planName,
    price: this.world.price,
    renew_at: this.world.renewAt,
    usages: [],
    included_usage: { title: 'Plan perks', items: [] },
  }
  // Fix "now" so daysRemainingInCycle(renew_at) reproduces the scenario's stated remaining-days count,
  // matching Billing.jsx's real computation instead of the actual wall-clock date the suite runs on.
  if (this.world.renewAt && typeof this.world.remainingDays === 'number') {
    const renewDate = new Date(this.world.renewAt)
    const nowDate = new Date(renewDate.getTime() - this.world.remainingDays * 24 * 60 * 60 * 1000)
    this.clock = FakeTimers.install({ now: nowDate, toFake: ['Date'] })
  }
  render(React.createElement(Billing))
  await screen.findByText('Plan & Billing')
})

Given('{string} has opened the upgrade confirmation modal', async function (name) {
  const ctaButton = await screen.findByTestId('billing-upgrade-cta-button')
  const user = userEvent.setup()
  await user.click(ctaButton)
  await screen.findByRole('dialog')
})

When(/^"([^"]+)" clicks "([^"]+)"$/, async function (name, buttonLabel) {
  const user = userEvent.setup()
  const button = screen.getByText(buttonLabel, { selector: 'button' })
  await user.click(button)
})

Then(/^an "([^"]+)" button is visible, positioned top-right of the "([^"]+)" heading$/, async function (buttonLabel, headingText) {
  const button = await screen.findByTestId('billing-upgrade-cta-button')
  assert.equal(button.textContent, buttonLabel)
  assert.ok(screen.getByText(headingText))
})

Then('a modal opens titled {string}', async function (title) {
  const dialog = await screen.findByRole('dialog')
  assert.ok(dialog.textContent.includes(title))
})

Then('the modal shows the body copy {string}', function (bodyCopy) {
  const dialog = screen.getByRole('dialog')
  assert.ok(dialog.textContent.includes(bodyCopy))
})

Then('the modal shows {string} as {string}', function (label, value) {
  const dialog = screen.getByRole('dialog')
  assert.ok(dialog.textContent.includes(label))
  assert.ok(dialog.textContent.includes(value))
})

Then(/^the modal lists exactly these 3 bullets: "([^"]+)", "([^"]+)", "([^"]+)"$/, function (b1, b2, b3) {
  const items = screen.getAllByRole('listitem')
  assert.equal(items.length, 3)
  assert.equal(items[0].textContent, b1)
  assert.equal(items[1].textContent, b2)
  assert.equal(items[2].textContent, b3)
})

Then('the modal does not list {string} or any other bullet', function (forbidden) {
  const list = screen.getByRole('list')
  assert.ok(!list.textContent.includes(forbidden))
})

Then('the modal shows a primary button labeled {string}', function (label) {
  const button = screen.getByTestId('upgrade-modal-confirm-button')
  assert.equal(button.textContent, label)
})

Then('the modal shows a secondary {string} button', function (label) {
  const button = screen.getByTestId('upgrade-modal-cancel-button')
  assert.equal(button.textContent, label)
})

Then(/^the modal closes and "([^"]+)" still shows "([^"]+)" at "([^"]+)"$/, function (name, planLine, price) {
  assert.equal(screen.queryByRole('dialog'), null)
  const planName = planLine.split(': ')[1]
  assert.ok(screen.getByText(planName))
  assert.ok(document.body.textContent.includes(price))
})

Then(/^the "([^"]+)" button becomes disabled immediately$/, function (label) {
  const button = screen.getByTestId('upgrade-modal-confirm-button')
  assert.equal(button.disabled, true)
})

Then('a second click on the same button does not submit a second request while the first is in flight', async function () {
  const button = screen.getByTestId('upgrade-modal-confirm-button')
  const user = userEvent.setup()
  await user.click(button) // second click; button is disabled so this must not fire another request
  const upgradeCalls = this.fetchCalls.filter((c) => c.url.includes('/api/billing/upgrade'))
  assert.equal(upgradeCalls.length, 1)
})
