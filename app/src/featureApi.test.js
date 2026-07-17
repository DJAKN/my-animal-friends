import test from 'node:test'
import assert from 'node:assert/strict'

import { fetchBirdSound, requestNatureWalk } from './featureApi.js'

test('requestNatureWalk posts the bounded guide request to the same-origin proxy', async () => {
  let call
  const payload = { areaLabel: 'Shibuya', candidates: [{ id: 'w1' }] }
  const result = await requestNatureWalk(payload, async (url, init) => {
    call = { url, init }
    return { ok: true, json: async () => ({ mode: 'fallback', stops: [] }) }
  })
  assert.equal(call.url, '/api/walk')
  assert.equal(call.init.method, 'POST')
  assert.deepEqual(JSON.parse(call.init.body), payload)
  assert.equal(result.mode, 'fallback')
})

test('fetchBirdSound returns null on unavailable audio without throwing', async () => {
  const result = await fetchBirdSound('Ardea cinerea', async () => ({
    ok: true,
    json: async () => ({ sound: null }),
  }))
  assert.equal(result, null)
})

test('feature API errors expose the server message', async () => {
  await assert.rejects(
    () => requestNatureWalk({}, async () => ({ ok: false, json: async () => ({ error: 'No candidates' }) })),
    /No candidates/,
  )
})
