import { useCallback, useEffect, useRef, useState } from 'react'
import MapView from './MapView.jsx'
import DetailCard from './DetailCard.jsx'
import {
  geocode, getNearbyData, getRouteData, aggregateSpecies,
} from './api.js'
import { FACTS } from './content.js'
import { DEMO_PLACES, demoPlaceLookup, DEMO_SCENARIOS } from './demo.js'
import { HeaderBar, LayerToggles, NearbyPanel, RoutePanel } from './chrome.jsx'

// Default to Shibuya — a data-rich demo scene — when location is unavailable.
const FALLBACK = { ...DEMO_PLACES.shibuya, key: 'shibuya' }

// Warm the cache for the presentation scenarios so their searches feel instant.
// Runs quietly in the background; failures are ignored (live fetch still works).
function prewarmDemo() {
  setTimeout(() => {
    for (const key of DEMO_SCENARIOS.nearby) {
      const p = DEMO_PLACES[key]
      getNearbyData(p.lat, p.lng, `nearby-${key}`).catch(() => {})
    }
    for (const [fromKey, toKey] of DEMO_SCENARIOS.routes) {
      getRouteData(DEMO_PLACES[fromKey], DEMO_PLACES[toKey], `route-${fromKey}-${toKey}`).catch(() => {})
    }
  }, 1200) // let the first, visible load claim the network first
}

export default function App() {
  const [mode, setMode] = useState('nearby')
  const [view, setView] = useState(null)          // camera command for the map
  const [user, setUser] = useState(null)          // user location dot
  const [wild, setWild] = useState([])
  const [places, setPlaces] = useState([])
  const [route, setRoute] = useState(null)
  const [selected, setSelected] = useState(null)
  const [showWild, setShowWild] = useState(true)
  const [showPlaces, setShowPlaces] = useState(true)
  const [status, setStatus] = useState({ text: 'Finding your neighborhood…', busy: true })
  const [banner, setBanner] = useState(null)
  const [factIdx, setFactIdx] = useState(0)
  const loadSeq = useRef(0)

  // Rotate one gentle fact in the footer
  useEffect(() => {
    const t = setInterval(() => setFactIdx((i) => (i + 1) % FACTS.length), 12000)
    return () => clearInterval(t)
  }, [])

  // snapshotKey lets demo scenarios load instantly from a captured JSON (offline-safe).
  const loadNearby = useCallback(async (lat, lng, label, snapshotKey) => {
    const seq = ++loadSeq.current
    setStatus({ text: `Meeting the neighbors around ${label}…`, busy: true })
    setSelected(null)
    setRoute(null)
    setView({ center: [lat, lng], zoom: 12 })
    const { wild: w, places: p } = await getNearbyData(lat, lng, snapshotKey)
    if (seq !== loadSeq.current) return
    const species = aggregateSpecies(w)
    setWild(species)
    setPlaces(p)
    if (!species.length && !p.length) {
      setStatus({ text: 'It’s quiet here. Try searching a nearby town or park.', busy: false })
    } else {
      setStatus({ text: `${species.length} wild neighbors · ${p.length} animal places near ${label}`, busy: false })
    }
  }, [])

  // On load: ask for location, fall back to the Shibuya demo scene. Then pre-warm
  // the demo scenarios in the background so the presentation searches feel instant.
  useEffect(() => {
    const onFallback = (msg) => {
      if (msg) setStatus({ text: msg, busy: false })
      loadNearby(FALLBACK.lat, FALLBACK.lng, FALLBACK.label, `nearby-${FALLBACK.key}`)
    }
    if (!navigator.geolocation) onFallback()
    else
      navigator.geolocation.getCurrentPosition(
        (pos) => { setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude }); loadNearby(pos.coords.latitude, pos.coords.longitude, 'you') },
        () => onFallback('Location is off — showing Shibuya. Search any place to explore.'),
        { timeout: 8000 },
      )
    prewarmDemo()
  }, [loadNearby])

  const searchPlace = async (q) => {
    if (!q.trim()) return
    try {
      setStatus({ text: 'Looking that up…', busy: true })
      const demo = demoPlaceLookup(q)
      const g = demo || (await geocode(q))
      await loadNearby(g.lat, g.lng, g.label, demo ? `nearby-${q.trim().toLowerCase()}` : null)
    } catch (e) {
      setStatus({ text: e.message, busy: false, error: true })
    }
  }

  const planRoute = async (fromQ, toQ) => {
    if (!fromQ.trim() || !toQ.trim()) return
    const seq = ++loadSeq.current
    try {
      setBanner(null)
      setSelected(null)
      setStatus({ text: 'Tracing the road…', busy: true })
      const fromDemo = demoPlaceLookup(fromQ)
      const toDemo = demoPlaceLookup(toQ)
      const [from, to] = await Promise.all([fromDemo || geocode(fromQ), toDemo || geocode(toQ)])
      const snapshotKey =
        fromDemo && toDemo ? `route-${fromQ.trim().toLowerCase()}-${toQ.trim().toLowerCase()}` : null

      setStatus({ text: 'Listening for who lives along the way…', busy: true })
      const { route: r, wild: w, places: routePlaces } = await getRouteData(from, to, snapshotKey)
      if (seq !== loadSeq.current) return

      setRoute(r)
      setView({ bounds: [[Math.min(from.lat, to.lat), Math.min(from.lng, to.lng)], [Math.max(from.lat, to.lat), Math.max(from.lng, to.lng)]] })

      // Aggregate into species, ordered along the route.
      const species = aggregateSpecies(w).sort((a, b) => (a.routeLeg ?? 99) - (b.routeLeg ?? 99))
      setWild(species)
      setPlaces(routePlaces)
      setStatus({ text: `${from.label} → ${to.label} · ${Math.round(r.distanceKm)} km`, busy: false })
      setBanner(
        species.length || routePlaces.length
          ? `Along your way, you may meet ${species.length} wild neighbors${routePlaces.length ? ` · ${routePlaces.length} animal places` : ''}`
          : 'A quiet road — the animals are keeping to themselves today.',
      )
    } catch (e) {
      if (seq === loadSeq.current) setStatus({ text: e.message, busy: false, error: true })
    }
  }

  const selectAndPan = (item) => {
    setSelected(item)
    setView({ center: [item.lat, item.lng], zoom: 14 })
  }

  const switchMode = (m) => {
    setMode(m)
    setBanner(null)
    setSelected(null)
    if (m === 'nearby') {
      setRoute(null)
      const c = user || FALLBACK
      loadNearby(c.lat, c.lng, user ? 'you' : FALLBACK.label, user ? null : `nearby-${FALLBACK.key}`)
    }
  }

  return (
    <div className="app">
      <MapView
        view={view} user={user} wild={wild} places={places} route={route}
        showWild={showWild} showPlaces={showPlaces}
        selectedId={selected?.id} onSelect={setSelected}
      />

      <HeaderBar mode={mode} onSwitch={switchMode} />

      <LayerToggles
        showWild={showWild} showPlaces={showPlaces}
        onWild={() => setShowWild(!showWild)} onPlaces={() => setShowPlaces(!showPlaces)}
      />

      {mode === 'nearby'
        ? <NearbyPanel status={status} onSearch={searchPlace} />
        : <RoutePanel status={status} wild={wild} selected={selected} onGo={planRoute} onPick={selectAndPan} />}

      {banner && <div className="banner glass">🌿 {banner}</div>}

      <DetailCard item={selected} onClose={() => setSelected(null)} />

      <div className="fact glass"><b>Did you know?</b> {FACTS[factIdx]}</div>
    </div>
  )
}

