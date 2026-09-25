// Shared behaviour-test support: a stubbed Billing API at the fetch boundary.
import { vi } from 'vitest'

export function billingPayload(overrides = {}) {
  return {
    plan_name: 'Standard',
    price: '$20/month',
    renew_at: 'Oct 30, 2026',
    usages: [
      { id: 'video-quality', label: 'Video quality', type: 'feature', value: 'Full HD (1080p)', help: 'Resolution' },
      { id: 'screens', label: 'Watch at the same time', type: 'feature', value: 'Can watch on 2 devices at once', help: 'Streams' },
      { id: 'downloads', label: 'Download on devices', type: 'feature', value: 'Can download on 2 devices', help: 'Downloads' },
    ],
    included_usage: {
      title: 'Plan perks',
      items: [
        { id: 'ad-free', label: 'Ad-free streaming', used_percent: 100 },
        { id: 'spatial-audio', label: 'Spatial audio (select titles)', used_percent: 100 },
      ],
      help: 'Perks included in your plan.',
    },
    ...overrides,
  }
}

// Every request the page makes is recorded; GET /api/billing answers with the payload.
export function stubBillingApi(payload) {
  const fetchMock = vi.fn((url) => {
    if (String(url).startsWith('/api/billing?')) {
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(payload) })
    }
    return Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ detail: 'Not Found' }) })
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function requestsTo(fetchMock, fragment) {
  return fetchMock.mock.calls.filter(([url]) => String(url).includes(fragment))
}
