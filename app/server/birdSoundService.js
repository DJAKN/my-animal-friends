const XENO_CANTO_URL = 'https://xeno-canto.org/api/3/recordings'
const SAFE_SCIENTIFIC_NAME = /^[\p{L}][\p{L} .'-]{1,118}$/u

export async function findBirdSound(scientificName, { apiKey, fetchImpl = fetch } = {}) {
  if (!apiKey) return null
  if (!SAFE_SCIENTIFIC_NAME.test(scientificName || '')) {
    throw new Error('A valid scientific name is required')
  }

  const params = new URLSearchParams({
    query: `sp:"${scientificName}"`,
    key: apiKey,
  })
  const response = await fetchImpl(`${XENO_CANTO_URL}?${params}`)
  if (!response.ok) throw new Error(`xeno-canto request failed with ${response.status}`)
  const data = await response.json()
  const recordings = (data.recordings || [])
    .map(normalizeRecording)
    .filter(Boolean)
    .sort((a, b) => qualityRank(a.quality) - qualityRank(b.quality))
  return recordings[0] || null
}

export function normalizeRecording(recording = {}) {
  if (!recording.file || !recording.url || !recording.rec || !recording.lic) return null
  return {
    id: String(recording.id || recording.nr || ''),
    commonName: recording.en || '',
    quality: recording.q || '',
    audioUrl: secureUrl(recording.file),
    sourceUrl: secureUrl(recording.url),
    recordist: recording.rec,
    licenseUrl: secureUrl(recording.lic),
  }
}

function secureUrl(value) {
  if (value.startsWith('//')) return `https:${value}`
  if (value.startsWith('http://')) return `https://${value.slice(7)}`
  return value
}

function qualityRank(quality) {
  const rank = { A: 0, B: 1, C: 2, D: 3, E: 4 }
  return rank[quality] ?? 5
}
