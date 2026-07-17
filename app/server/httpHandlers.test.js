import test from 'node:test'
import assert from 'node:assert/strict'

import { createBirdSoundHandler, createWalkHandler } from './httpHandlers.js'

function responseRecorder() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) { this.headers[name] = value },
    end(value) { this.body = JSON.parse(value) },
  }
}

test('walk handler returns a safe fallback when server keys are absent', async () => {
  const handler = createWalkHandler({ env: {} })
  const res = responseRecorder()
  await handler({ method: 'POST', body: {
    areaLabel: 'Shibuya', start: { lat: 35.658, lng: 139.701 }, timeBucket: 'day', season: 'summer',
    candidates: [
      { id: 'w1', commonName: 'Crow', lat: 35.66, lng: 139.70 },
      { id: 'w2', commonName: 'Heron', lat: 35.65, lng: 139.71 },
    ],
  } }, res)

  assert.equal(res.statusCode, 200)
  assert.equal(res.body.mode, 'fallback')
  assert.equal(res.body.routingAvailable, false)
})

test('bird handler rejects non-POST requests', async () => {
  const handler = createBirdSoundHandler({ env: {} })
  const res = responseRecorder()
  await handler({ method: 'GET' }, res)
  assert.equal(res.statusCode, 405)
  assert.equal(res.body.error, 'Method not allowed')
})

test('bird handler returns unavailable without exposing key state', async () => {
  const handler = createBirdSoundHandler({ env: {} })
  const res = responseRecorder()
  await handler({ method: 'POST', body: { scientificName: 'Ardea cinerea' } }, res)
  assert.equal(res.statusCode, 200)
  assert.deepEqual(res.body, { sound: null })
})
