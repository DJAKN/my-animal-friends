import test from 'node:test'
import assert from 'node:assert/strict'
import {
  TIME_BUCKETS,
  getActivityProfile,
  activityEmphasis,
  activityCopy,
  getTimeBucket,
  getSeason,
} from './activity.js'

test('exposes four calm time buckets', () => {
  assert.deepEqual(TIME_BUCKETS, ['dawn', 'day', 'dusk', 'night'])
})

test('uses curated names before iconic taxon defaults', () => {
  assert.equal(getActivityProfile({ commonName: 'Ural Owl', iconicTaxon: 'Aves' }).kind, 'nocturnal')
  assert.equal(getActivityProfile({ sciName: 'Ardea cinerea', iconicTaxon: 'Aves' }).kind, 'diurnal')
  assert.equal(getActivityProfile({ commonName: 'Japanese Boar', iconicTaxon: 'Mammalia' }).kind, 'crepuscular')
})

test('falls back to reviewable iconic taxon profiles', () => {
  assert.equal(getActivityProfile({ iconicTaxon: 'Aves' }).kind, 'diurnal')
  assert.equal(getActivityProfile({ iconicTaxon: 'Mammalia' }).kind, 'crepuscular')
  assert.equal(getActivityProfile({ iconicTaxon: 'Mollusca' }).kind, 'variable')
})

test('emphasizes matching periods without hiding any animal', () => {
  const nocturnal = { kind: 'nocturnal' }
  assert.ok(activityEmphasis(nocturnal, 'night') > activityEmphasis(nocturnal, 'day'))
  for (const kind of ['diurnal', 'nocturnal', 'crepuscular', 'variable']) {
    for (const bucket of TIME_BUCKETS) assert.ok(activityEmphasis({ kind }, bucket) >= 0.35)
  }
})

test('writes conditional educational copy', () => {
  const copy = activityCopy({ kind: 'crepuscular' }, 'dusk', 'summer')
  assert.match(copy, /often/i)
  assert.match(copy, /dusk/i)
  assert.doesNotMatch(copy, /will appear|guaranteed/i)
})

test('derives local time buckets and hemisphere-aware seasons', () => {
  assert.equal(getTimeBucket(new Date('2026-07-17T05:30:00')), 'dawn')
  assert.equal(getTimeBucket(new Date('2026-07-17T13:00:00')), 'day')
  assert.equal(getTimeBucket(new Date('2026-07-17T18:30:00')), 'dusk')
  assert.equal(getTimeBucket(new Date('2026-07-17T23:00:00')), 'night')
  assert.equal(getSeason(new Date('2026-07-17T12:00:00Z'), 35), 'summer')
  assert.equal(getSeason(new Date('2026-07-17T12:00:00Z'), -35), 'winter')
})
