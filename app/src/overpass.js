export const OVERPASS_ENDPOINTS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

export const OVERPASS_TIMEOUT_MS = 15000

export class OverpassRequestError extends Error {
  constructor(failures) {
    super('Every Overpass endpoint failed')
    this.name = 'OverpassRequestError'
    this.failures = failures
  }
}

export async function fetchOverpass(
  query,
  {
    fetchImpl = fetch,
    endpoints = OVERPASS_ENDPOINTS,
    timeoutMs = OVERPASS_TIMEOUT_MS,
  } = {},
) {
  const failures = []

  for (const endpoint of endpoints) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal: controller.signal,
      })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const data = await response.json()
      if (!Array.isArray(data?.elements)) throw new Error('Invalid Overpass payload')
      return data
    } catch (error) {
      failures.push({
        endpoint,
        message: error.name === 'AbortError' ? `Timed out after ${timeoutMs}ms` : error.message,
      })
    } finally {
      clearTimeout(timer)
    }
  }

  throw new OverpassRequestError(failures)
}
