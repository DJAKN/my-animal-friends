// Route geometry + roadside encounters for the Shibuya → Ueno flythrough.
//
// The waypoints approximate the real driving corridor (north-east across
// central Tokyo). Run `npm run capture:route` on a networked machine to fetch
// the exact OSRM geometry (writes public/route-shibuya-ueno.json); paste its
// `latlng` array in below to make the flythrough geographically exact.

import { TAXON_META } from '../../app/src/content.js'

export const ROUTE_LATLNG = [
  [35.6595, 139.7005], // Shibuya
  [35.6668, 139.7078],
  [35.6742, 139.7169],
  [35.6791, 139.7284],
  [35.6825, 139.7402], // Akasaka area
  [35.6879, 139.7521],
  [35.6968, 139.7638],
  [35.7057, 139.7719],
  [35.7141, 139.7774], // Ueno
]

// Convert lat/lng to a local metric plane (x east, y north) around the route.
const MEAN_LAT = 35.686
const M_PER_DEG_LAT = 111320
const M_PER_DEG_LNG = 111320 * Math.cos((MEAN_LAT * Math.PI) / 180)
const origin = ROUTE_LATLNG[0]
function toMeters([lat, lng]) {
  return { x: (lng - origin[1]) * M_PER_DEG_LNG, y: (lat - origin[0]) * M_PER_DEG_LAT }
}

const pts = ROUTE_LATLNG.map(toMeters)
const cum = [0]
for (let i = 1; i < pts.length; i++) {
  const dx = pts[i].x - pts[i - 1].x
  const dy = pts[i].y - pts[i - 1].y
  cum.push(cum[i - 1] + Math.hypot(dx, dy))
}
export const ROUTE_LENGTH = cum[cum.length - 1]

// Position (in meters) at arc length s along the polyline.
export function posAt(s) {
  const t = Math.max(0, Math.min(ROUTE_LENGTH, s))
  let i = 1
  while (i < cum.length && cum[i] < t) i++
  const a = pts[i - 1]
  const b = pts[i] || pts[i - 1]
  const seg = cum[i] - cum[i - 1] || 1
  const f = (t - cum[i - 1]) / seg
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
}

// Travel bearing (radians, atan2(dy,dx)) at arc length s.
export function bearingAt(s) {
  const a = posAt(s - 3)
  const b = posAt(s + 3)
  return Math.atan2(b.y - a.y, b.x - a.x)
}

function animal(commonName, sciName, iconicTaxon, count) {
  return {
    kind: 'wild',
    id: `enc-${sciName}`,
    commonName,
    sciName,
    iconicTaxon,
    emoji: TAXON_META[iconicTaxon]?.emoji || '🐾',
    count,
  }
}

// Roadside encounters: t = progress along route (0..1); side = -1 left / +1 right;
// offsetM = metres off the road centre.
export const ENCOUNTERS = [
  { ...animal('Large-billed Crow', 'Corvus macrorhynchos', 'Aves', 7), t: 0.12, side: -1, offsetM: 11 },
  { ...animal('Japanese Raccoon Dog', 'Nyctereutes viverrinus', 'Mammalia', 4), t: 0.28, side: 1, offsetM: 13 },
  { ...animal('Grey Heron', 'Ardea cinerea', 'Aves', 3), t: 0.44, side: -1, offsetM: 12 },
  { ...animal('Azure-winged Magpie', 'Cyanopica cyanus', 'Aves', 5), t: 0.60, side: 1, offsetM: 10 },
  { ...animal('Brown-eared Bulbul', 'Hypsipetes amaurotis', 'Aves', 6), t: 0.74, side: -1, offsetM: 12 },
  { ...animal('Common Kingfisher', 'Alcedo atthis', 'Aves', 2), t: 0.88, side: 1, offsetM: 11 },
]

// Precompute each encounter's world position + arc length for projection.
export const ENCOUNTER_WORLD = ENCOUNTERS.map((e) => {
  const s = e.t * ROUTE_LENGTH
  const p = posAt(s)
  const b = bearingAt(s)
  // Offset perpendicular to travel (left normal = (-sin, cos)).
  const nx = -Math.sin(b) * e.side
  const ny = Math.cos(b) * e.side
  return { ...e, s, world: { x: p.x + nx * e.offsetM, y: p.y + ny * e.offsetM } }
})

export const START_LABEL = 'Shibuya'
export const END_LABEL = 'Ueno'
