// Demo optimization: known coordinates for the presentation scenarios so
// searches resolve instantly (no Nominatim round-trip), plus the list of
// scenarios to pre-warm and to capture as offline snapshots.

export const DEMO_PLACES = {
  shibuya: { lat: 35.6595, lng: 139.7005, label: 'Shibuya' },
  shimonoseki: { lat: 33.9578, lng: 130.9410, label: 'Shimonoseki' },
  roppongi: { lat: 35.6628, lng: 139.7315, label: 'Roppongi' },
}

// Normalize a free-text query to a gazetteer key (case/space insensitive).
export function demoPlaceLookup(q) {
  const k = q.trim().toLowerCase()
  return DEMO_PLACES[k] || null
}

// Scenarios warmed on startup and baked into offline snapshots.
export const DEMO_SCENARIOS = {
  nearby: ['shibuya', 'shimonoseki'],
  routes: [['shibuya', 'roppongi']],
}
