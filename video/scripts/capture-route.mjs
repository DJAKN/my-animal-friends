// Capture the real OSRM driving geometry for the Shibuya → Ueno flythrough.
//
// Run on a networked machine:  npm run capture:route
// Writes public/route-shibuya-ueno.json with the exact road polyline.
// (route.js uses hand-placed waypoints until this file is present.)

import { writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const SHIBUYA = { lat: 35.6595, lng: 139.7005 }
const UENO = { lat: 35.7141, lng: 139.7774 }

async function main() {
  const url =
    `https://router.project-osrm.org/route/v1/driving/` +
    `${SHIBUYA.lng},${SHIBUYA.lat};${UENO.lng},${UENO.lat}?overview=full&geometries=geojson`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`OSRM ${res.status}`)
  const data = await res.json()
  const r = data.routes?.[0]
  if (!r) throw new Error('No route returned')
  const latlng = r.geometry.coordinates.map(([lng, lat]) => [lat, lng])
  await mkdir(OUT, { recursive: true })
  await writeFile(
    join(OUT, 'route-shibuya-ueno.json'),
    JSON.stringify({ latlng, distanceKm: r.distance / 1000, durationMin: r.duration / 60 }),
  )
  console.log(`Saved ${latlng.length} points · ${Math.round(r.distance / 1000)} km → public/route-shibuya-ueno.json`)
}
main().catch((e) => { console.error('Capture failed:', e.message); process.exit(1) })
