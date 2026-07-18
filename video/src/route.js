// Route geometry + roadside encounters for the Shibuya → Ueno flythrough.
//
// The waypoints approximate the real driving corridor (north-east across
// central Tokyo). Run `npm run capture:route` on a networked machine to fetch
// the exact OSRM geometry (writes public/route-shibuya-ueno.json); paste its
// `latlng` array in below to make the flythrough geographically exact.

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

// ——— World building ———
const MEAN_LAT = 35.686
const M_PER_DEG_LAT = 111320
const M_PER_DEG_LNG = 111320 * Math.cos((MEAN_LAT * Math.PI) / 180)

// Chaikin corner-cutting: rounds the polyline's hard corners into soft curves
// so the camera never snaps its heading at a waypoint.
function chaikin(points, iterations = 3) {
  let pts = points
  for (let it = 0; it < iterations; it++) {
    const next = [pts[0]]
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      next.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25])
      next.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75])
    }
    next.push(pts[pts.length - 1])
    pts = next
  }
  return pts
}

const smooth = chaikin(ROUTE_LATLNG)
const origin = smooth[0]
const pts = smooth.map(([lat, lng]) => ({
  x: (lng - origin[1]) * M_PER_DEG_LNG,
  y: (lat - origin[0]) * M_PER_DEG_LAT,
}))

// Extend the road straight past Ueno so the drawable world never runs out ahead
// of the camera (this is what previously tore the road apart near the end).
{
  const a = pts[pts.length - 2]
  const b = pts[pts.length - 1]
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1
  pts.push({ x: b.x + ((b.x - a.x) / len) * 600, y: b.y + ((b.y - a.y) / len) * 600 })
}

const cum = [0]
for (let i = 1; i < pts.length; i++) {
  cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
}
// Travelable length ends at Ueno; the extra 600m exists only to keep drawing road.
export const ROUTE_LENGTH = cum[cum.length - 2]
export const DRAWABLE_LENGTH = cum[cum.length - 1]

export function posAt(s) {
  const t = Math.max(0, Math.min(DRAWABLE_LENGTH, s))
  let i = 1
  while (i < cum.length && cum[i] < t) i++
  const a = pts[i - 1]
  const b = pts[i] || pts[i - 1]
  const seg = cum[i] - cum[i - 1] || 1
  const f = (t - cum[i - 1]) / seg
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f }
}

// Heading smoothed over a wide window — no whip-pans at corners.
export function bearingAt(s, half = 130) {
  const a = posAt(s - half)
  const b = posAt(s + half)
  return Math.atan2(b.y - a.y, b.x - a.x)
}

// Roadside encounters: t = progress along route (0..1); side = -1 left / +1 right.
const raw = [
  { commonName: 'Large-billed Crow', sciName: 'Corvus macrorhynchos', count: 7, t: 0.12, side: -1, offsetM: 11 },
  { commonName: 'Japanese Raccoon Dog', sciName: 'Nyctereutes viverrinus', count: 4, t: 0.28, side: 1, offsetM: 13 },
  { commonName: 'Grey Heron', sciName: 'Ardea cinerea', count: 3, t: 0.44, side: -1, offsetM: 12 },
  { commonName: 'Azure-winged Magpie', sciName: 'Cyanopica cyanus', count: 5, t: 0.6, side: 1, offsetM: 10 },
  { commonName: 'Brown-eared Bulbul', sciName: 'Hypsipetes amaurotis', count: 6, t: 0.74, side: -1, offsetM: 12 },
  { commonName: 'Common Kingfisher', sciName: 'Alcedo atthis', count: 2, t: 0.88, side: 1, offsetM: 11 },
]

export const ENCOUNTER_WORLD = raw.map((e) => {
  const s = e.t * ROUTE_LENGTH
  const p = posAt(s)
  const b = bearingAt(s)
  const nx = -Math.sin(b) * e.side
  const ny = Math.cos(b) * e.side
  return { ...e, id: `enc-${e.sciName}`, s, world: { x: p.x + nx * e.offsetM, y: p.y + ny * e.offsetM } }
})

export const START_LABEL = 'Shibuya'
export const END_LABEL = 'Ueno'
