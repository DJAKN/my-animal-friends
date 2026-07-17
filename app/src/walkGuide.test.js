import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildWalkCandidates,
  buildFallbackGuide,
  validateGuideSelection,
} from './walkGuide.js'

const start = { lat: 35.6595, lng: 139.7005 }

function animal(id, lat, lng, iconicTaxon = 'Aves') {
  return {
    id,
    lat,
    lng,
    commonName: `Animal ${id}`,
    sciName: `Species ${id}`,
    iconicTaxon,
    count: 2,
  }
}

test('builds a bounded and diverse candidate list near the start', () => {
  const animals = [
    animal('a', 35.6600, 139.7010, 'Aves'),
    animal('b', 35.6610, 139.7020, 'Aves'),
    animal('c', 35.6620, 139.7030, 'Mammalia'),
    animal('d', 35.6630, 139.7040, 'Insecta'),
    animal('far', 35.75, 139.80, 'Aves'),
  ]

  const candidates = buildWalkCandidates(animals, start, { maxCandidates: 3, radiusKm: 3 })

  assert.equal(candidates.length, 3)
  assert.deepEqual(new Set(candidates.map((item) => item.iconicTaxon)), new Set(['Aves', 'Mammalia', 'Insecta']))
  assert.ok(candidates.every((item) => item.distanceFromStartKm <= 3))
})

test('prefers animals whose activity matches the selected time', () => {
  const quietNearby = { ...animal('quiet', 35.6596, 139.7006), activityScore: 0.35 }
  const activeFarther = { ...animal('active', 35.6620, 139.7030), activityScore: 1 }
  const candidates = buildWalkCandidates([quietNearby, activeFarther], start, { maxCandidates: 1 })
  assert.equal(candidates[0].id, 'active')
})

test('creates a narrative-only fallback with conditional language', () => {
  const candidates = buildWalkCandidates([
    animal('a', 35.6600, 139.7010),
    animal('b', 35.6610, 139.7020, 'Mammalia'),
    animal('c', 35.6620, 139.7030, 'Insecta'),
  ], start)

  const guide = buildFallbackGuide({
    areaLabel: 'Shibuya',
    timeBucket: 'dusk',
    season: 'summer',
    candidates,
  })

  assert.equal(guide.mode, 'fallback')
  assert.equal(guide.routingAvailable, false)
  assert.equal(guide.route, null)
  assert.equal(guide.stops.length, 3)
  assert.match(guide.stops[0].narration, /may notice/i)
  assert.doesNotMatch(guide.stops.map((stop) => stop.narration).join(' '), /will see|guaranteed/i)
})

test('rejects model selections containing unknown loops or stops', () => {
  assert.throws(
    () => validateGuideSelection({ loopId: 'unknown', stopIds: ['a'] }, ['loop-1'], ['a', 'b']),
    /Unknown loop ID/,
  )
  assert.throws(
    () => validateGuideSelection({ loopId: 'loop-1', stopIds: ['invented'] }, ['loop-1'], ['a', 'b']),
    /Unknown stop ID/,
  )
})

test('accepts a selection containing only allowed identifiers', () => {
  const selection = { loopId: 'loop-1', stopIds: ['a', 'b'] }
  assert.deepEqual(validateGuideSelection(selection, ['loop-1'], ['a', 'b']), selection)
})
