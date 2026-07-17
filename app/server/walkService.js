import { buildFallbackGuide, validateGuideSelection } from '../src/walkGuide.js'

const OPENAI_URL = 'https://api.openai.com/v1/responses'
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson'

export async function createWalk(request, { routeClient, narrativeClient } = {}) {
  const clean = validateRequest(request)
  if (!routeClient || clean.candidates.length < 2) return buildFallbackGuide(clean)

  let loops
  try {
    loops = (await routeClient(clean)).filter(isUsableLoop)
  } catch {
    return buildFallbackGuide(clean)
  }
  if (!loops.length) return buildFallbackGuide(clean)

  const shortest = [...loops].sort((a, b) => a.distanceKm - b.distanceKm)[0]
  if (!narrativeClient) return buildRoutedFallback(clean, shortest)

  try {
    const selection = await narrativeClient({ request: clean, loops })
    validateGuideSelection(
      { loopId: selection.loopId, stopIds: selection.stops?.map((stop) => stop.id) },
      loops.map((loop) => loop.id),
      clean.candidates.map((candidate) => candidate.id),
    )
    const loop = loops.find((candidate) => candidate.id === selection.loopId)
    const loopStops = new Set(loop.stopIds)
    if (!selection.stops?.length || selection.stops.some((stop) => !loopStops.has(stop.id))) {
      throw new Error('Narrative includes a stop outside the selected loop')
    }
    return {
      mode: 'live',
      routingAvailable: true,
      loopId: loop.id,
      route: routeWithSummary(loop),
      distanceKm: loop.distanceKm,
      durationMin: loop.durationMin,
      opening: selection.opening,
      closing: selection.closing,
      stops: selection.stops,
    }
  } catch {
    return buildRoutedFallback(clean, shortest)
  }
}

export function createOpenAiNarrativeClient({ apiKey, model, fetchImpl = fetch }) {
  if (!apiKey || !model) return null
  return async ({ request, loops }) => {
    const animals = request.candidates.map(({ id, commonName, sciName, iconicTaxon }) => ({
      id, commonName, sciName, iconicTaxon,
    }))
    const routeOptions = loops.map(({ id, stopIds, distanceKm, durationMin }) => ({
      id, stopIds, distanceKm: round(distanceKm, 1), durationMin: Math.round(durationMin),
    }))
    const response = await fetchImpl(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        instructions: [
          'You write calm, practical nature-walk narration in English.',
          'Select exactly one supplied route loop and only its supplied animal stop IDs.',
          'Never promise a sighting. Use conditional language and encourage distance, quiet, and habitat care.',
          'Write 40-70 words of narration per stop. Do not invent directions or geographic facts.',
        ].join(' '),
        input: JSON.stringify({
          areaLabel: request.areaLabel,
          timeBucket: request.timeBucket,
          season: request.season,
          animals,
          routeOptions,
        }),
        text: { format: walkGuideSchema() },
      }),
    })
    if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`)
    const data = await response.json()
    const outputText = data.output_text || data.output
      ?.flatMap((item) => item.content || [])
      .find((content) => content.type === 'output_text')?.text
    if (!outputText) throw new Error('OpenAI response did not contain structured output')
    return JSON.parse(outputText)
  }
}

export function createOrsRouteClient({ apiKey, fetchImpl = fetch }) {
  if (!apiKey) return null
  return async (request) => {
    const maxStops = Math.min(5, request.candidates.length)
    const minStops = Math.min(3, maxStops)
    const stopCounts = Array.from({ length: maxStops - minStops + 1 }, (_, index) => minStops + index)
    const attempts = await Promise.allSettled(stopCounts.map(async (stopCount) => {
      const stops = request.candidates.slice(0, stopCount)
      const coordinates = [
        [request.start.lng, request.start.lat],
        ...stops.map((stop) => [stop.lng, stop.lat]),
        [request.start.lng, request.start.lat],
      ]
      const response = await fetchImpl(ORS_URL, {
        method: 'POST',
        headers: {
          Authorization: apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/geo+json, application/json',
        },
        body: JSON.stringify({ coordinates, instructions: false }),
      })
      if (!response.ok) throw new Error(`OpenRouteService request failed with ${response.status}`)
      const data = await response.json()
      const feature = data.features?.[0]
      const summary = feature?.properties?.summary
      if (!feature?.geometry?.coordinates?.length || !summary) throw new Error('OpenRouteService returned no route')
      const distanceKm = summary.distance / 1000
      const durationMin = summary.duration / 60 + stops.length * 4
      if (distanceKm < 1.5 || distanceKm > 3 || durationMin < 30 || durationMin > 45) {
        throw new Error('Route falls outside the walk target')
      }
      return {
        id: `loop-${stopCount}`,
        stopIds: stops.map((stop) => stop.id),
        route: { latlngs: feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]) },
        distanceKm,
        durationMin,
      }
    }))
    const loops = attempts.filter((attempt) => attempt.status === 'fulfilled').map((attempt) => attempt.value)
    if (!loops.length) throw new Error('No pedestrian loop met the walk target')
    return loops
  }
}

function validateRequest(request = {}) {
  if (!request.areaLabel || !Number.isFinite(request.start?.lat) || !Number.isFinite(request.start?.lng)) {
    throw new Error('A valid area label and start coordinate are required')
  }
  const candidates = (request.candidates || []).filter((candidate) =>
    candidate.id && candidate.commonName && Number.isFinite(candidate.lat) && Number.isFinite(candidate.lng))
  return {
    areaLabel: String(request.areaLabel).slice(0, 120),
    start: { lat: request.start.lat, lng: request.start.lng },
    timeBucket: request.timeBucket || 'day',
    season: request.season || 'spring',
    candidates: candidates.slice(0, 8),
  }
}

function isUsableLoop(loop) {
  return loop?.id && loop.stopIds?.length >= 2 && loop.route?.latlngs?.length >= 2
    && Number.isFinite(loop.distanceKm) && Number.isFinite(loop.durationMin)
}

function routeWithSummary(loop) {
  return { ...loop.route, distanceKm: loop.distanceKm, durationMin: loop.durationMin }
}

function buildRoutedFallback(request, loop) {
  const candidatesById = new Map(request.candidates.map((candidate) => [candidate.id, candidate]))
  const candidates = loop.stopIds.map((id) => candidatesById.get(id)).filter(Boolean)
  const fallback = buildFallbackGuide({ ...request, candidates })
  return {
    ...fallback,
    mode: 'routed-fallback',
    routingAvailable: true,
    loopId: loop.id,
    route: routeWithSummary(loop),
    distanceKm: loop.distanceKm,
    durationMin: loop.durationMin,
    opening: `A gentle ${request.timeBucket} loop around ${request.areaLabel}, following a real walking route.`,
  }
}

function walkGuideSchema() {
  const stop = {
    type: 'object',
    additionalProperties: false,
    required: ['id', 'title', 'narration', 'coexistenceTip'],
    properties: {
      id: { type: 'string' },
      title: { type: 'string' },
      narration: { type: 'string' },
      coexistenceTip: { type: 'string' },
    },
  }
  return {
    type: 'json_schema',
    name: 'nature_walk_guide',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['loopId', 'opening', 'closing', 'stops'],
      properties: {
        loopId: { type: 'string' },
        opening: { type: 'string' },
        closing: { type: 'string' },
        stops: { type: 'array', minItems: 2, maxItems: 5, items: stop },
      },
    },
  }
}

function round(value, digits) {
  const factor = 10 ** digits
  return Math.round(value * factor) / factor
}
