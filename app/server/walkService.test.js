import test from 'node:test'
import assert from 'node:assert/strict'

import { createWalk, createOpenAiNarrativeClient, createOrsRouteClient } from './walkService.js'

const request = {
  areaLabel: 'Shibuya',
  start: { lat: 35.658, lng: 139.701 },
  timeBucket: 'dusk',
  season: 'summer',
  candidates: [
    { id: 'w1', commonName: 'Grey Heron', sciName: 'Ardea cinerea', iconicTaxon: 'Aves', lat: 35.66, lng: 139.705 },
    { id: 'w2', commonName: 'Large-billed Crow', sciName: 'Corvus macrorhynchos', iconicTaxon: 'Aves', lat: 35.655, lng: 139.706 },
    { id: 'w3', commonName: 'Japanese Raccoon Dog', sciName: 'Nyctereutes viverrinus', iconicTaxon: 'Mammalia', lat: 35.654, lng: 139.698 },
  ],
}

test('createWalk returns a routed guide using only approved loop and stop IDs', async () => {
  const routeClient = async () => [{
    id: 'loop-a',
    stopIds: ['w1', 'w2', 'w3'],
    route: { latlngs: [[35.658, 139.701], [35.66, 139.705], [35.658, 139.701]] },
    distanceKm: 2.2,
    durationMin: 35,
  }]
  const narrativeClient = async () => ({
    loopId: 'loop-a',
    opening: 'A slow dusk loop through Shibuya.',
    closing: 'Return with the neighborhood a little more alive.',
    stops: request.candidates.map((animal) => ({
      id: animal.id,
      title: animal.commonName,
      narration: `Pause nearby and look gently for ${animal.commonName}.`,
      coexistenceTip: 'Keep a respectful distance.',
    })),
  })

  const result = await createWalk(request, { routeClient, narrativeClient })

  assert.equal(result.mode, 'live')
  assert.equal(result.routingAvailable, true)
  assert.equal(result.loopId, 'loop-a')
  assert.deepEqual(result.stops.map((stop) => stop.id), ['w1', 'w2', 'w3'])
  assert.equal(result.route.distanceKm, 2.2)
})

test('createWalk falls back safely when route generation is unavailable', async () => {
  const result = await createWalk(request, {
    routeClient: async () => { throw new Error('routing unavailable') },
    narrativeClient: async () => { throw new Error('must not run') },
  })

  assert.equal(result.mode, 'fallback')
  assert.equal(result.routingAvailable, false)
  assert.equal(result.route, null)
  assert.match(result.opening, /Shibuya/)
})

test('createWalk keeps a real route when narrative generation fails', async () => {
  const result = await createWalk(request, {
    routeClient: async () => [{
      id: 'loop-a',
      stopIds: ['w1', 'w2', 'w3'],
      route: { latlngs: [[35.658, 139.701], [35.66, 139.705], [35.658, 139.701]] },
      distanceKm: 2,
      durationMin: 32,
    }],
    narrativeClient: async () => { throw new Error('OpenAI unavailable') },
  })

  assert.equal(result.mode, 'routed-fallback')
  assert.equal(result.routingAvailable, true)
  assert.equal(result.route.distanceKm, 2)
  assert.equal(result.stops.length, 3)
})

test('createWalk rejects an invented model stop and uses routed fallback copy', async () => {
  const result = await createWalk(request, {
    routeClient: async () => [{
      id: 'loop-a', stopIds: ['w1', 'w2', 'w3'],
      route: { latlngs: [[35.658, 139.701], [35.658, 139.701]] },
      distanceKm: 2, durationMin: 30,
    }],
    narrativeClient: async () => ({
      loopId: 'loop-a', opening: 'Hello', closing: 'Bye',
      stops: [{ id: 'invented', title: 'Dragon', narration: 'Look up.', coexistenceTip: 'Run.' }],
    }),
  })

  assert.equal(result.mode, 'routed-fallback')
  assert.deepEqual(result.stops.map((stop) => stop.id), ['w1', 'w2', 'w3'])
})

test('OpenAI client sends coarse context with strict structured output and no coordinates', async () => {
  let captured
  const client = createOpenAiNarrativeClient({
    apiKey: 'test-key',
    model: 'test-model',
    fetchImpl: async (_url, init) => {
      captured = JSON.parse(init.body)
      return {
        ok: true,
        json: async () => ({ output_text: JSON.stringify({
          loopId: 'loop-a', opening: 'Open', closing: 'Close',
          stops: request.candidates.map((animal) => ({ id: animal.id, title: animal.commonName, narration: 'Notice quietly.', coexistenceTip: 'Give space.' })),
        }) }),
      }
    },
  })

  await client({ request, loops: [{ id: 'loop-a', stopIds: ['w1', 'w2', 'w3'], distanceKm: 2, durationMin: 30 }] })

  assert.equal(captured.model, 'test-model')
  assert.equal(captured.text.format.type, 'json_schema')
  assert.equal(captured.text.format.strict, true)
  const sent = JSON.stringify(captured)
  assert.equal(sent.includes('35.658'), false)
  assert.equal(sent.includes('139.701'), false)
})

test('ORS client requests foot-walking loops and normalizes GeoJSON coordinates', async () => {
  let capturedUrl
  let capturedBody
  const client = createOrsRouteClient({
    apiKey: 'ors-key',
    fetchImpl: async (url, init) => {
      capturedUrl = url
      capturedBody = JSON.parse(init.body)
      return {
        ok: true,
        json: async () => ({
          features: [{
            geometry: { coordinates: [[139.701, 35.658], [139.705, 35.66], [139.701, 35.658]] },
            properties: { summary: { distance: 2200, duration: 1500 } },
          }],
        }),
      }
    },
  })

  const loops = await client(request)

  assert.match(capturedUrl, /foot-walking\/geojson/)
  assert.deepEqual(capturedBody.coordinates[0], [139.701, 35.658])
  assert.deepEqual(capturedBody.coordinates.at(-1), [139.701, 35.658])
  assert.deepEqual(loops[0].route.latlngs[1], [35.66, 139.705])
  assert.equal(loops[0].distanceKm, 2.2)
  assert.equal(loops[0].durationMin, 37)
})

test('ORS client refuses routes outside the walk distance and duration target', async () => {
  const client = createOrsRouteClient({
    apiKey: 'ors-key',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        features: [{
          geometry: { coordinates: [[139.701, 35.658], [139.8, 35.7], [139.701, 35.658]] },
          properties: { summary: { distance: 6200, duration: 4800 } },
        }],
      }),
    }),
  })
  await assert.rejects(() => client(request), /target/i)
})
