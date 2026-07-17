import test from 'node:test'
import assert from 'node:assert/strict'
import {
  fetchOverpass,
  OverpassRequestError,
  OVERPASS_ENDPOINTS,
  OVERPASS_TIMEOUT_MS,
} from './overpass.js'

const validPayload = { elements: [{ type: 'way', id: 221599485 }] }

function jsonResponse(data) {
  return { ok: true, status: 200, json: async () => data }
}

test('uses browser-compatible public endpoints and a realistic timeout', () => {
  assert.deepEqual(OVERPASS_ENDPOINTS, [
    'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
    'https://overpass-api.de/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
  ])
  assert.equal(OVERPASS_TIMEOUT_MS, 15000)
})

test('falls back after an HTTP failure', async () => {
  const calls = []
  const fetchImpl = async (endpoint) => {
    calls.push(endpoint)
    if (calls.length === 1) return { ok: false, status: 406 }
    return jsonResponse(validPayload)
  }

  const result = await fetchOverpass('[out:json];out;', {
    fetchImpl,
    endpoints: ['https://first.test', 'https://second.test'],
  })

  assert.deepEqual(result, validPayload)
  assert.deepEqual(calls, ['https://first.test', 'https://second.test'])
})

test('falls back after an endpoint timeout', async () => {
  const calls = []
  const fetchImpl = (endpoint, { signal }) => {
    calls.push(endpoint)
    if (calls.length === 2) return Promise.resolve(jsonResponse(validPayload))
    return new Promise((_, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('aborted')
        error.name = 'AbortError'
        reject(error)
      }, { once: true })
    })
  }

  const result = await fetchOverpass('[out:json];out;', {
    fetchImpl,
    endpoints: ['https://slow.test', 'https://healthy.test'],
    timeoutMs: 5,
  })

  assert.deepEqual(result, validPayload)
  assert.deepEqual(calls, ['https://slow.test', 'https://healthy.test'])
})

test('falls back after a malformed payload', async () => {
  let attempts = 0
  const fetchImpl = async () => {
    attempts += 1
    return jsonResponse(attempts === 1 ? { remarks: 'missing elements' } : validPayload)
  }

  const result = await fetchOverpass('[out:json];out;', {
    fetchImpl,
    endpoints: ['https://malformed.test', 'https://healthy.test'],
  })

  assert.deepEqual(result, validPayload)
  assert.equal(attempts, 2)
})

test('reports every endpoint failure when failover is exhausted', async () => {
  const endpoints = ['https://one.test', 'https://two.test']
  const fetchImpl = async () => ({ ok: false, status: 503 })

  await assert.rejects(
    fetchOverpass('[out:json];out;', { fetchImpl, endpoints }),
    (error) => {
      assert.ok(error instanceof OverpassRequestError)
      assert.equal(error.failures.length, 2)
      assert.deepEqual(error.failures.map((failure) => failure.endpoint), endpoints)
      return true
    },
  )
})
