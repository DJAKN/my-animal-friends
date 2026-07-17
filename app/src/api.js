// All data comes from free, key-less public APIs, fetched client-side.
// Every call fails soft: a broken layer never blocks the rest of the app.

const cache = new Map()

async function cachedJson(key, url, options) {
  if (cache.has(key)) return cache.get(key)
  const res = await fetch(url, options)
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  const data = await res.json()
  cache.set(key, data)
  return data
}

const ICONIC_TAXA = 'Mammalia,Aves,Reptilia,Amphibia,Actinopterygii,Mollusca,Insecta,Arachnida'

/** Recent wild animal observations (with photos) around a point, from iNaturalist. */
export async function fetchWildSightings(lat, lng, radiusKm = 12, perPage = 60) {
  const key = `inat:${lat.toFixed(3)},${lng.toFixed(3)},${radiusKm},${perPage}`
  const url =
    `https://api.inaturalist.org/v1/observations?lat=${lat}&lng=${lng}&radius=${radiusKm}` +
    `&iconic_taxa=${ICONIC_TAXA}&photos=true&quality_grade=research` +
    `&per_page=${perPage}&order_by=observed_on&order=desc`
  const data = await cachedJson(key, url)
  return (data.results || [])
    .map((o) => {
      const [lngc, latc] = o.geojson?.coordinates || []
      const t = o.taxon
      if (latc == null || !t) return null
      return {
        kind: 'wild',
        id: `w${o.id}`,
        lat: latc,
        lng: lngc,
        commonName: t.preferred_common_name || t.name,
        sciName: t.name,
        taxonId: t.id,
        iconicTaxon: t.iconic_taxon_name || 'Unknown',
        photo: o.photos?.[0]?.url || null, // "square" 75px thumbnail
        photoLarge: o.photos?.[0]?.url?.replace('square', 'medium') || null,
        observedOn: o.observed_on || null,
        placeGuess: o.place_guess || null,
        conservation: t.conservation_status?.status || null,
        wikipediaUrl: t.wikipedia_url || null,
        inatUrl: o.uri || `https://www.inaturalist.org/observations/${o.id}`,
      }
    })
    .filter(Boolean)
}

/** Zoos, aquariums, wildlife parks and animal cafes around a point, from OpenStreetMap. */
export async function fetchAnimalPlaces(lat, lng, radiusM = 12000) {
  const around = `(around:${radiusM},${lat},${lng})`
  return overpassPlaces(`
    nwr["tourism"~"^(zoo|aquarium)$"]${around};
    nwr["zoo"]${around};
    nwr["leisure"="bird_hide"]${around};
    nwr["amenity"="cafe"]["name"~"cat|dog|neko|owl|hedgehog|animal|bird|rabbit",i]${around};
  `)
}

/** Same as fetchAnimalPlaces but along a route corridor (Overpass linestring `around`). */
export async function fetchPlacesAlongRoute(latlngs, radiusM = 4000) {
  const chain = latlngs.map(([la, ln]) => `${la},${ln}`).join(',')
  const around = `(around:${radiusM},${chain})`
  return overpassPlaces(`
    nwr["tourism"~"^(zoo|aquarium)$"]${around};
    nwr["zoo"]${around};
    nwr["amenity"="cafe"]["name"~"cat|dog|neko|owl|hedgehog|animal|bird|rabbit",i]${around};
  `)
}

async function overpassPlaces(body) {
  const query = `[out:json][timeout:25];(${body});out center tags 60;`
  const key = `ovp:${query}`
  const data = await cachedJson(key, 'https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  })
  return (data.elements || [])
    .map((el) => {
      const lat = el.lat ?? el.center?.lat
      const lng = el.lon ?? el.center?.lon
      const tags = el.tags || {}
      const name = tags.name || tags['name:en']
      if (lat == null || !name) return null
      const type =
        tags.tourism === 'aquarium' ? 'aquarium'
        : tags.tourism === 'zoo' || tags.zoo ? 'zoo'
        : tags.leisure === 'bird_hide' ? 'bird_hide'
        : 'cafe'
      return {
        kind: 'place',
        id: `p${el.type}${el.id}`,
        lat, lng, name, type,
        website: tags.website || tags['contact:website'] || null,
        openingHours: tags.opening_hours || null,
      }
    })
    .filter(Boolean)
}

/** Free-text place name → coordinates, via Nominatim. */
export async function geocode(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
  const data = await cachedJson(`geo:${q}`, url)
  if (!data[0]) throw new Error(`Could not find “${q}”`)
  return { lat: +data[0].lat, lng: +data[0].lon, label: data[0].display_name.split(',')[0] }
}

/** Road route between two points via the public OSRM demo server. */
export async function fetchRoute(from, to) {
  const url =
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}` +
    `?overview=full&geometries=geojson`
  const data = await cachedJson(`osrm:${url}`, url)
  const r = data.routes?.[0]
  if (!r) throw new Error('No road route found between those places')
  return {
    latlngs: r.geometry.coordinates.map(([ln, la]) => [la, ln]),
    distanceKm: r.distance / 1000,
    durationMin: r.duration / 60,
  }
}

/** Short encyclopedia summary for an animal, via Wikipedia. */
export async function fetchWikiSummary(sighting) {
  const title = sighting.wikipediaUrl
    ? decodeURIComponent(sighting.wikipediaUrl.split('/wiki/')[1] || '')
    : sighting.commonName
  if (!title) return null
  try {
    const data = await cachedJson(
      `wiki:${title}`,
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    )
    return { extract: data.extract, url: data.content_urls?.desktop?.page }
  } catch {
    return null
  }
}

/** Pick `count` points spread evenly along a polyline (for corridor sampling). */
export function samplePolyline(latlngs, count = 6) {
  if (latlngs.length <= count) return latlngs
  const step = (latlngs.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => latlngs[Math.round(i * step)])
}

/** Thin a polyline down to at most `max` points (Overpass query size limit). */
export function simplifyPolyline(latlngs, max = 30) {
  if (latlngs.length <= max) return latlngs
  const step = (latlngs.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => latlngs[Math.round(i * step)])
}

export function dedupeByTaxon(sightings) {
  const seen = new Set()
  return sightings.filter((s) => {
    if (seen.has(s.taxonId)) return false
    seen.add(s.taxonId)
    return true
  })
}
