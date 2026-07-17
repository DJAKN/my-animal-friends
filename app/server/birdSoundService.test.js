import test from 'node:test'
import assert from 'node:assert/strict'

import { findBirdSound, normalizeRecording } from './birdSoundService.js'

test('findBirdSound returns null without a server API key', async () => {
  let called = false
  const result = await findBirdSound('Ardea cinerea', {
    fetchImpl: async () => { called = true },
  })
  assert.equal(result, null)
  assert.equal(called, false)
})

test('findBirdSound queries by scientific species and prefers higher quality audio', async () => {
  let requested
  const result = await findBirdSound('Ardea cinerea', {
    apiKey: 'xc-key',
    fetchImpl: async (url) => {
      requested = url
      return {
        ok: true,
        json: async () => ({ recordings: [
          { id: '1', gen: 'Ardea', sp: 'cinerea', en: 'Grey Heron', rec: 'Low Quality', q: 'C', file: '//example.test/c.mp3', url: '//xeno-canto.org/1', lic: '//creativecommons.org/licenses/by-nc-sa/4.0/' },
          { id: '2', gen: 'Ardea', sp: 'cinerea', en: 'Grey Heron', rec: 'Field Recorder', q: 'A', file: 'https://example.test/a.mp3', url: 'https://xeno-canto.org/2', lic: 'https://creativecommons.org/licenses/by/4.0/' },
        ] }),
      }
    },
  })

  assert.match(requested, /^https:\/\/xeno-canto\.org\/api\/3\/recordings\?/)
  assert.equal(new URL(requested).searchParams.get('query'), 'sp:"Ardea cinerea"')
  assert.equal(result.audioUrl, 'https://example.test/a.mp3')
  assert.equal(result.recordist, 'Field Recorder')
  assert.equal(result.sourceUrl, 'https://xeno-canto.org/2')
  assert.equal(result.licenseUrl, 'https://creativecommons.org/licenses/by/4.0/')
})

test('findBirdSound rejects unsafe scientific names before fetching', async () => {
  await assert.rejects(
    () => findBirdSound('Ardea cinerea&key=stolen', { apiKey: 'xc-key', fetchImpl: async () => ({ ok: true }) }),
    /scientific name/i,
  )
})

test('normalizeRecording requires audio, source, recordist, and license attribution', () => {
  assert.equal(normalizeRecording({ file: '//audio.test/a.mp3', url: '//xeno-canto.org/1', rec: '', lic: '//license.test' }), null)
  assert.deepEqual(
    normalizeRecording({ id: '3', file: '//audio.test/a.mp3', url: '//xeno-canto.org/3', rec: 'A. Birder', lic: '//license.test/by', en: 'Crow', q: 'B' }),
    {
      id: '3',
      commonName: 'Crow',
      quality: 'B',
      audioUrl: 'https://audio.test/a.mp3',
      sourceUrl: 'https://xeno-canto.org/3',
      recordist: 'A. Birder',
      licenseUrl: 'https://license.test/by',
    },
  )
})
