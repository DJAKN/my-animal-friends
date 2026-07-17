const EARTH_RADIUS_KM = 6371

export function buildWalkCandidates(
  animals,
  start,
  { maxCandidates = 8, radiusKm = 3 } = {},
) {
  const nearby = animals
    .filter((animal) => Number.isFinite(animal.lat) && Number.isFinite(animal.lng))
    .map((animal) => ({
      id: animal.id,
      lat: animal.lat,
      lng: animal.lng,
      commonName: animal.commonName,
      sciName: animal.sciName,
      iconicTaxon: animal.iconicTaxon || 'Unknown',
      count: animal.count || 1,
      photo: animal.photo || null,
      activityScore: Number.isFinite(animal.activityScore) ? animal.activityScore : 0.8,
      distanceFromStartKm: distanceKm(start, animal),
    }))
    .filter((animal) => animal.distanceFromStartKm <= radiusKm)
    .sort((a, b) => b.activityScore - a.activityScore || a.distanceFromStartKm - b.distanceFromStartKm)

  const groups = new Map()
  for (const animal of nearby) {
    if (!groups.has(animal.iconicTaxon)) groups.set(animal.iconicTaxon, [])
    groups.get(animal.iconicTaxon).push(animal)
  }

  const selected = []
  while (selected.length < maxCandidates && [...groups.values()].some((group) => group.length)) {
    for (const group of groups.values()) {
      if (group.length && selected.length < maxCandidates) selected.push(group.shift())
    }
  }
  return selected
}

export function buildFallbackGuide({ areaLabel, timeBucket, season, candidates }) {
  const stops = candidates.slice(0, 5).map((candidate, index) => ({
    id: candidate.id,
    title: `${index + 1}. ${candidate.commonName}`,
    narration: `Near this part of ${areaLabel}, you may notice signs of ${candidate.commonName}. Around ${timeBucket}, move slowly, listen before looking, and leave enough space for this neighbor to continue its ${season} rhythm undisturbed.`,
    coexistenceTip: 'Pause quietly, keep your distance, and leave the place as you found it.',
  }))

  return {
    mode: 'fallback',
    routingAvailable: false,
    route: null,
    distanceKm: null,
    durationMin: null,
    opening: `A gentle ${timeBucket} nature walk around ${areaLabel}. Routing is unavailable, so use these stops as a calm observation guide rather than turn-by-turn directions.`,
    closing: 'Take only memories, leave every habitat undisturbed, and let the animals set the pace.',
    stops,
  }
}

export function validateGuideSelection(selection, allowedLoopIds, allowedStopIds) {
  if (!allowedLoopIds.includes(selection?.loopId)) throw new Error(`Unknown loop ID: ${selection?.loopId}`)
  const allowedStops = new Set(allowedStopIds)
  for (const stopId of selection.stopIds || []) {
    if (!allowedStops.has(stopId)) throw new Error(`Unknown stop ID: ${stopId}`)
  }
  return selection
}

function distanceKm(a, b) {
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const deltaLat = lat2 - lat1
  const deltaLng = toRadians(b.lng - a.lng)
  const h = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

function toRadians(value) {
  return (value * Math.PI) / 180
}
