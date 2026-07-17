import { useCallback, useEffect, useRef, useState } from 'react'
import MapView from './MapView.jsx'
import DetailCard from './DetailCard.jsx'
import {
  fetchWildSightings, fetchAnimalPlaces, fetchPlacesAlongRoute,
  geocode, fetchRoute, fetchWikiSummary,
  samplePolyline, simplifyPolyline, dedupeByTaxon,
} from './api.js'
import { FACTS, TAXON_META } from './content.js'

// A scenic, data-rich fallback for when location access is unavailable.
const FALLBACK = { lat: 35.6852, lng: 139.7528, label: 'Tokyo' }

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

  const loadNearby = useCallback(async (lat, lng, label) => {
    const seq = ++loadSeq.current
    setStatus({ text: `Meeting the neighbors around ${label}…`, busy: true })
    setSelected(null)
    setRoute(null)
    setView({ center: [lat, lng], zoom: 12 })
    const [w, p] = await Promise.all([
      fetchWildSightings(lat, lng).catch(() => []),
      fetchAnimalPlaces(lat, lng).catch(() => []),
    ])
    if (seq !== loadSeq.current) return
    setWild(dedupeByTaxon(w))
    setPlaces(p)
    if (!w.length && !p.length) {
      setStatus({ text: 'It’s quiet here. Try searching a nearby town or park.', busy: false })
    } else {
      setStatus({ text: `${dedupeByTaxon(w).length} wild neighbors · ${p.length} animal places near ${label}`, busy: false })
    }
  }, [])

  // On load: ask for location, fall back gracefully.
  useEffect(() => {
    if (!navigator.geolocation) { loadNearby(FALLBACK.lat, FALLBACK.lng, FALLBACK.label); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        setUser({ lat, lng })
        loadNearby(lat, lng, 'you')
      },
      () => {
        setStatus({ text: 'Location is off — showing a sample neighborhood. Search any place to explore.', busy: false })
        loadNearby(FALLBACK.lat, FALLBACK.lng, FALLBACK.label)
      },
      { timeout: 8000 },
    )
  }, [loadNearby])

  const searchPlace = async (q) => {
    if (!q.trim()) return
    try {
      setStatus({ text: 'Looking that up…', busy: true })
      const g = await geocode(q)
      await loadNearby(g.lat, g.lng, g.label)
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
      const [from, to] = await Promise.all([geocode(fromQ), geocode(toQ)])
      const r = await fetchRoute(from, to)
      if (seq !== loadSeq.current) return
      setRoute(r)
      setView({ bounds: [[Math.min(from.lat, to.lat), Math.min(from.lng, to.lng)], [Math.max(from.lat, to.lat), Math.max(from.lng, to.lng)]] })
      setStatus({ text: 'Listening for who lives along the way…', busy: true })

      const samples = samplePolyline(r.latlngs, 6)
      const [wildBatches, routePlaces] = await Promise.all([
        Promise.all(samples.map(([la, ln]) => fetchWildSightings(la, ln, 6, 20).catch(() => []))),
        fetchPlacesAlongRoute(simplifyPolyline(r.latlngs)).catch(() => []),
      ])
      if (seq !== loadSeq.current) return

      // Order encounters along the route by which sample point found them.
      const seen = new Set()
      const ordered = []
      wildBatches.forEach((batch, i) => {
        for (const s of dedupeByTaxon(batch)) {
          if (seen.has(s.taxonId)) continue
          seen.add(s.taxonId)
          ordered.push({ ...s, routeLeg: i })
        }
      })
      setWild(ordered)
      setPlaces(routePlaces)
      const km = Math.round(r.distanceKm)
      setStatus({ text: `${from.label} → ${to.label} · ${km} km`, busy: false })
      setBanner(
        ordered.length || routePlaces.length
          ? `Along your way, you may meet ${ordered.length} wild neighbors${routePlaces.length ? ` · ${routePlaces.length} animal places` : ''}`
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
      loadNearby(c.lat, c.lng, user ? 'you' : FALLBACK.label)
    }
  }

  return (
    <div className="app">
      <MapView
        view={view} user={user} wild={wild} places={places} route={route}
        showWild={showWild} showPlaces={showPlaces}
        selectedId={selected?.id} onSelect={setSelected}
      />

      <header className="header glass">
        <div className="brand">
          <span className="brand-mark">🦝</span>
          <div>
            <div className="brand-name">My Animal Friends</div>
            <div className="brand-sub">the world we share</div>
          </div>
        </div>
        <nav className="mode-switch">
          <button className={mode === 'nearby' ? 'active' : ''} onClick={() => switchMode('nearby')}>Nearby</button>
          <button className={mode === 'route' ? 'active' : ''} onClick={() => switchMode('route')}>Route</button>
        </nav>
      </header>

      <div className="layers glass">
        <button className={showWild ? 'on' : ''} onClick={() => setShowWild(!showWild)}>🐾 Wild</button>
        <button className={showPlaces ? 'on' : ''} onClick={() => setShowPlaces(!showPlaces)}>🏡 Places</button>
      </div>

      {mode === 'nearby'
        ? <NearbyPanel status={status} onSearch={searchPlace} />
        : <RoutePanel status={status} wild={wild} selected={selected} onGo={planRoute} onPick={selectAndPan} />}

      {banner && <div className="banner glass">🌿 {banner}</div>}

      <DetailCard item={selected} onClose={() => setSelected(null)} />

      <div className="fact glass"><b>Did you know?</b> {FACTS[factIdx]}</div>
    </div>
  )
}

function NearbyPanel({ status, onSearch }) {
  const [q, setQ] = useState('')
  const submit = (e) => { e.preventDefault(); onSearch(q) }
  return (
    <section className="panel glass">
      <h2>Neighbors nearby</h2>
      <p className="hint">Wild sightings glow softly on the map; zoos, aquariums and animal cafes wear little badges. Tap anyone to meet them.</p>
      <form className="field" onSubmit={submit}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Explore another place… e.g. Kyoto" />
        <button className="btn" type="submit">Go</button>
      </form>
      <StatusLine status={status} />
    </section>
  )
}

function RoutePanel({ status, wild, selected, onGo, onPick }) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const submit = (e) => { e.preventDefault(); onGo(from, to) }
  return (
    <section className="panel glass">
      <h2>Along your way</h2>
      <p className="hint">Pick a start and a destination — we’ll follow the road and introduce who lives beside it.</p>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="field"><input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From… e.g. Tokyo" /></div>
        <div className="field">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To… e.g. Nikko" />
          <button className="btn" type="submit" disabled={status.busy}>Go</button>
        </div>
      </form>
      <StatusLine status={status} />
      {wild.length > 0 && (
        <div className="encounters">
          {wild.map((s) => (
            <button key={s.id} className={`encounter${selected?.id === s.id ? ' selected' : ''}`} onClick={() => onPick(s)}>
              {s.photo
                ? <img src={s.photo} alt="" />
                : <div className="thumb-fallback">{TAXON_META[s.iconicTaxon]?.emoji || '🐾'}</div>}
              <div>
                <div className="enc-name">{s.commonName}</div>
                <div className="enc-sub">{s.sciName}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

function StatusLine({ status }) {
  if (status.busy) return <span className="loading-pill">{status.text}</span>
  return <span className={`status${status.error ? ' error' : ''}`}>{status.text}</span>
}
