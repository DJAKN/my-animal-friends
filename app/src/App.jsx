import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import MapView from './MapView.jsx'
import DetailCard from './DetailCard.jsx'
import {
  geocode, getNearbyData, getRouteData, aggregateSpecies,
} from './api.js'
import { FACTS, TAXON_META } from './content.js'
import { DEMO_PLACES, demoPlaceLookup, DEMO_SCENARIOS } from './demo.js'
import { activityEmphasis, getActivityProfile, getSeason, getTimeBucket, TIME_BUCKETS } from './activity.js'
import { requestNatureWalk } from './featureApi.js'
import { buildWalkCandidates } from './walkGuide.js'

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
  const [nearbyCenter, setNearbyCenter] = useState(FALLBACK)
  const [timeBucket, setTimeBucket] = useState(() => getTimeBucket())
  const [walkState, setWalkState] = useState({ busy: false, guide: null, error: null })
  const loadSeq = useRef(0)
  const season = useMemo(() => getSeason(new Date(), nearbyCenter.lat), [nearbyCenter.lat])
  const displayWild = useMemo(() => [...wild].sort((a, b) =>
    activityEmphasis(getActivityProfile(b), timeBucket) - activityEmphasis(getActivityProfile(a), timeBucket)), [wild, timeBucket])

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
    setWalkState({ busy: false, guide: null, error: null })
    setNearbyCenter({ lat, lng, label })
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
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            onFallback('Location is off — showing Shibuya. Search any place to explore.')
            return
          }
          setUser({ lat, lng })
          loadNearby(lat, lng, 'you')
        },
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

  const createGentleWalk = async () => {
    const candidates = buildWalkCandidates(wild.map((animal) => ({
      ...animal,
      activityScore: activityEmphasis(getActivityProfile(animal), timeBucket),
    })), nearbyCenter, { radiusKm: 1.5 })
    if (candidates.length < 2) {
      setWalkState({ busy: false, guide: null, error: 'Not enough nearby observations for a walk yet. Try a park or another neighborhood.' })
      return
    }
    setWalkState({ busy: true, guide: null, error: null })
    try {
      const guide = await requestNatureWalk({
        areaLabel: nearbyCenter.label || 'your neighborhood',
        start: { lat: nearbyCenter.lat, lng: nearbyCenter.lng },
        timeBucket,
        season,
        candidates,
      })
      setWalkState({ busy: false, guide, error: null })
      setRoute(guide.route)
      setSelected(null)
      if (guide.route?.latlngs?.length) {
        setView({ bounds: boundsFor(guide.route.latlngs) })
        setBanner(`A ${Math.round(guide.durationMin)}-minute gentle loop, guided by the animals nearby`)
      } else {
        setBanner('A gentle observation guide is ready; walking directions are unavailable right now')
      }
    } catch (error) {
      setWalkState({ busy: false, guide: null, error: error.message })
    }
  }

  const selectWalkStop = (stop) => {
    const animal = wild.find((item) => item.id === stop.id)
    if (animal) selectAndPan(animal)
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
        view={view} user={user} wild={displayWild} places={places} route={route}
        showWild={showWild} showPlaces={showPlaces}
        selectedId={selected?.id} onSelect={setSelected} timeBucket={timeBucket}
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
        ? <NearbyPanel
            status={status} onSearch={searchPlace}
            timeBucket={timeBucket} onTimeBucket={setTimeBucket} season={season}
            walkState={walkState} onCreateWalk={createGentleWalk} onPickStop={selectWalkStop}
          />
        : <RoutePanel status={status} wild={wild} selected={selected} onGo={planRoute} onPick={selectAndPan} />}

      {banner && <div className="banner glass">🌿 {banner}</div>}

      <DetailCard item={selected} timeBucket={timeBucket} season={season} onClose={() => setSelected(null)} />

      <div className="fact glass"><b>Did you know?</b> {FACTS[factIdx]}</div>
    </div>
  )
}

function NearbyPanel({ status, onSearch, timeBucket, onTimeBucket, season, walkState, onCreateWalk, onPickStop }) {
  const [q, setQ] = useState('')
  const submit = (e) => { e.preventDefault(); onSearch(q) }
  return (
    <section className="panel glass">
      <h2>Neighbors nearby</h2>
      <p className="hint">Wild sightings glow softly on the map; zoos, aquariums and animal cafes wear little badges. Tap anyone to meet them.</p>
      <form className="field" onSubmit={submit}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Explore another place… e.g. Shimonoseki" />
        <button className="btn" type="submit">Go</button>
      </form>
      <StatusLine status={status} />
      <div className="time-lens" aria-label="Time lens">
        <div className="time-lens-heading"><b>Time lens</b><span>{season}</span></div>
        <div className="time-options">
          {TIME_BUCKETS.map((bucket) => (
            <button key={bucket} className={bucket === timeBucket ? 'active' : ''} onClick={() => onTimeBucket(bucket)}>
              {timeIcon(bucket)} {capitalize(bucket)}
            </button>
          ))}
        </div>
      </div>
      <button className="btn walk-cta" disabled={status.busy || walkState.busy} onClick={onCreateWalk}>
        {walkState.busy ? 'Weaving your walk…' : '🍃 Create a gentle walk'}
      </button>
      {walkState.error && <span className="status error">{walkState.error}</span>}
      {walkState.guide && <WalkGuide guide={walkState.guide} onPickStop={onPickStop} />}
    </section>
  )
}

function WalkGuide({ guide, onPickStop }) {
  return (
    <div className="walk-guide">
      <div className="walk-guide-heading">
        <b>Your gentle loop</b>
        {guide.routingAvailable
          ? <span>{guide.distanceKm.toFixed(1)} km · {Math.round(guide.durationMin)} min</span>
          : <span>Observation preview</span>}
      </div>
      <p>{guide.opening}</p>
      <div className="walk-stops">
        {guide.stops.map((stop) => (
          <button key={stop.id} onClick={() => onPickStop(stop)}>
            <b>{stop.title}</b>
            <span>{stop.narration}</span>
            <small>{stop.coexistenceTip}</small>
          </button>
        ))}
      </div>
      <p className="walk-closing">{guide.closing}</p>
    </div>
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
        <div className="field"><input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From… e.g. Shibuya" /></div>
        <div className="field">
          <input value={to} onChange={(e) => setTo(e.target.value)} placeholder="To… e.g. Roppongi" />
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

function boundsFor(latlngs) {
  const lats = latlngs.map(([lat]) => lat)
  const lngs = latlngs.map(([, lng]) => lng)
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
}

function timeIcon(bucket) {
  return { dawn: '🌅', day: '☀️', dusk: '🌆', night: '🌙' }[bucket]
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
