// Capture real demo data into offline snapshots.
//
// Run this ONCE on a machine with internet access:
//     cd app && npm run capture
//
// It fetches live iNaturalist + OpenStreetMap + OSRM data for the presentation
// scenarios and writes app/public/demo/*.json. The app then serves those files
// instantly and offline — so the demo works even without venue wifi.
//
// Re-run any time to refresh the snapshots with the latest sightings.

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'demo')

const DEMO_PLACES = {
  shibuya: { lat: 35.6595, lng: 139.7005, label: 'Shibuya' },
  shimonoseki: { lat: 33.9578, lng: 130.941, label: 'Shimonoseki' },
  roppongi: { lat: 35.6628, lng: 139.7315, label: 'Roppongi' },
}
const NEARBY = ['shibuya', 'shimonoseki']
const ROUTES = [['shibuya', 'roppongi']]

const ICONIC = 'Mammalia,Aves,Reptilia,Amphibia,Actinopterygii,Mollusca,Insecta,Arachnida'
const UA = { 'User-Agent': 'MyAnimalFriends-demo-capture/1.0 (hackathon)' }

async function getJson(url, options) {
  const res = await fetch(url, { ...options, headers: { ...UA, ...(options?.headers || {}) } })
  if (!res.ok) throw new Error(`${res.status} for ${url}`)
  return res.json()
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function mapWild(results) {
  return (results || [])
    .map((o) => {
      const [lng, lat] = o.geojson?.coordinates || []
      const t = o.taxon
      if (lat == null || !t) return null
      return {
        kind: 'wild', id: `w${o.id}`, lat, lng,
        commonName: t.preferred_common_name || t.name, sciName: t.name, taxonId: t.id,
        iconicTaxon: t.iconic_taxon_name || 'Unknown',
        photo: o.photos?.[0]?.url || null,
        photoLarge: o.photos?.[0]?.url?.replace('square', 'medium') || null,
        observedOn: o.observed_on || null, placeGuess: o.place_guess || null,
        conservation: t.conservation_status?.status || null,
        wikipediaUrl: t.wikipedia_url || null,
        inatUrl: o.uri || `https://www.inaturalist.org/observations/${o.id}`,
      }
    })
    .filter(Boolean)
}

async function fetchWild(lat, lng, radiusKm, perPage) {
  const url =
    `https://api.inaturalist.org/v1/observations?lat=${lat}&lng=${lng}&radius=${radiusKm}` +
    `&iconic_taxa=${ICONIC}&photos=true&quality_grade=research&per_page=${perPage}&order_by=observed_on&order=desc`
  return mapWild((await getJson(url)).results)
}

const PLACE_FILTERS = (around) => `
  nwr["tourism"~"^(zoo|aquarium)$"]${around};
  nwr["zoo"]${around};
  nwr["leisure"="bird_hide"]${around};
  nwr["amenity"="cafe"]["name"~"cat|dog|neko|owl|hedgehog|animal|bird|rabbit",i]${around};
  nwr["landuse"="farmyard"]["name"]${around};
  nwr["animal"~"petting|boarding"]${around};
`
async function overpass(body) {
  const query = `[out:json][timeout:25];(${body});out center tags 60;`
  const data = await getJson('https://overpass-api.de/api/interpreter', {
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
        : tags.landuse === 'farmyard' ? 'farm'
        : 'cafe'
      return {
        kind: 'place', id: `p${el.type}${el.id}`, lat, lng, name, type,
        website: tags.website || tags['contact:website'] || null,
        openingHours: tags.opening_hours || null,
      }
    })
    .filter(Boolean)
}

function samplePolyline(latlngs, count = 6) {
  if (latlngs.length <= count) return latlngs
  const step = (latlngs.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => latlngs[Math.round(i * step)])
}
function simplifyPolyline(latlngs, max = 30) {
  if (latlngs.length <= max) return latlngs
  const step = (latlngs.length - 1) / (max - 1)
  return Array.from({ length: max }, (_, i) => latlngs[Math.round(i * step)])
}

async function captureNearby(key) {
  const p = DEMO_PLACES[key]
  process.stdout.write(`  nearby-${key}… `)
  const [wild, places] = await Promise.all([fetchWild(p.lat, p.lng, 12, 60), overpass(PLACE_FILTERS(`(around:12000,${p.lat},${p.lng})`))])
  await writeFile(join(OUT, `nearby-${key}.json`), JSON.stringify({ wild, places }))
  console.log(`${wild.length} sightings · ${places.length} places`)
}

async function captureRoute(fromKey, toKey) {
  const from = DEMO_PLACES[fromKey]
  const to = DEMO_PLACES[toKey]
  process.stdout.write(`  route-${fromKey}-${toKey}… `)
  const osrm = await getJson(
    `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`,
  )
  const r = osrm.routes[0]
  const route = { latlngs: r.geometry.coordinates.map(([ln, la]) => [la, ln]), distanceKm: r.distance / 1000, durationMin: r.duration / 60 }

  const samples = samplePolyline(route.latlngs, 6)
  const batches = []
  for (const [la, ln] of samples) { batches.push(await fetchWild(la, ln, 6, 30)); await sleep(400) }
  const places = await overpass(PLACE_FILTERS(`(around:4000,${simplifyPolyline(route.latlngs).map(([la, ln]) => `${la},${ln}`).join(',')})`))

  const seen = new Set()
  const wild = []
  batches.forEach((batch, leg) => {
    for (const s of batch) { if (seen.has(s.id)) continue; seen.add(s.id); wild.push({ ...s, routeLeg: leg }) }
  })
  await writeFile(join(OUT, `route-${fromKey}-${toKey}.json`), JSON.stringify({ route, wild, places }))
  console.log(`${wild.length} sightings · ${places.length} places · ${Math.round(route.distanceKm)} km`)
}

async function main() {
  await mkdir(OUT, { recursive: true })
  console.log('Capturing demo snapshots →', OUT)
  for (const key of NEARBY) { await captureNearby(key); await sleep(600) }
  for (const [a, b] of ROUTES) { await captureRoute(a, b); await sleep(600) }
  console.log('Done. Snapshots are in app/public/demo/ — the demo now loads them offline.')
}
main().catch((e) => { console.error('Capture failed:', e.message); process.exit(1) })
