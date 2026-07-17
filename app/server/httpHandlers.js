import { findBirdSound } from './birdSoundService.js'
import { createOpenAiNarrativeClient, createOrsRouteClient, createWalk } from './walkService.js'

export function createWalkHandler({ env = process.env, fetchImpl = fetch } = {}) {
  const routeClient = createOrsRouteClient({ apiKey: env.OPENROUTESERVICE_API_KEY, fetchImpl })
  const narrativeClient = createOpenAiNarrativeClient({
    apiKey: env.OPENAI_API_KEY,
    model: env.OPENAI_MODEL || 'gpt-5-mini',
    fetchImpl,
  })
  return async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
    try {
      const guide = await createWalk(parseBody(req.body), { routeClient, narrativeClient })
      return sendJson(res, 200, guide)
    } catch (error) {
      return sendJson(res, 400, { error: error.message || 'Invalid walk request' })
    }
  }
}

export function createBirdSoundHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async (req, res) => {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' })
    try {
      const { scientificName } = parseBody(req.body)
      const sound = await findBirdSound(scientificName, {
        apiKey: env.XENO_CANTO_API_KEY,
        fetchImpl,
      })
      return sendJson(res, 200, { sound })
    } catch (error) {
      const invalid = /scientific name/i.test(error.message || '')
      return sendJson(res, invalid ? 400 : 502, { error: invalid ? error.message : 'Bird sound service is unavailable' })
    }
  }
}

function parseBody(body) {
  if (!body) return {}
  return typeof body === 'string' ? JSON.parse(body) : body
}

function sendJson(res, statusCode, body) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(JSON.stringify(body))
}
