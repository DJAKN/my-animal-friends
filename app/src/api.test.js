import test from 'node:test'
import assert from 'node:assert/strict'
import { buildCorePlaceFilters, mapOverpassElements } from './api.js'

test('core place filters exclude animal cafés', () => {
  const filters = buildCorePlaceFilters('(around:12000,33.9578,130.9410)')

  assert.match(filters, /tourism.*zoo\|aquarium/)
  assert.match(filters, /landuse.*farmyard/)
  assert.match(filters, /animal.*petting\|boarding/)
  assert.doesNotMatch(filters, /leisure.*bird_hide/)
  assert.doesNotMatch(filters, /amenity.*cafe/)
})

test('maps the Shimonoseki aquarium to an animal place', () => {
  const places = mapOverpassElements({
    elements: [{
      type: 'way',
      id: 221599485,
      center: { lat: 33.9544226, lon: 130.9423827 },
      tags: {
        name: '下関市立しものせき水族館・海響館',
        tourism: 'aquarium',
        wikidata: 'Q11361443',
      },
    }],
  })

  assert.deepEqual(places, [{
    kind: 'place',
    id: 'pway221599485',
    lat: 33.9544226,
    lng: 130.9423827,
    name: '下関市立しものせき水族館・海響館',
    type: 'aquarium',
    website: null,
    openingHours: null,
  }])
})
