import { useState } from 'react'
import { TAXON_META } from './content.js'

// Presentational UI chrome (header, layer toggles, side panels), kept free of
// Leaflet/API imports so the pitch-video project can reuse the real components.

export function HeaderBar({ mode, onSwitch }) {
  return (
    <header className="header glass">
      <div className="brand">
        <span className="brand-mark">🦝</span>
        <div>
          <div className="brand-name">My Animal Friends</div>
          <div className="brand-sub">the world we share</div>
        </div>
      </div>
      <nav className="mode-switch">
        <button className={mode === 'nearby' ? 'active' : ''} onClick={() => onSwitch('nearby')}>Nearby</button>
        <button className={mode === 'route' ? 'active' : ''} onClick={() => onSwitch('route')}>Route</button>
      </nav>
    </header>
  )
}

export function LayerToggles({ showWild, showPlaces, onWild, onPlaces }) {
  return (
    <div className="layers glass">
      <button className={showWild ? 'on' : ''} onClick={onWild}>🐾 Wild</button>
      <button className={showPlaces ? 'on' : ''} onClick={onPlaces}>🏡 Places</button>
    </div>
  )
}

export function NearbyPanel({ status, onSearch }) {
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
    </section>
  )
}

export function RoutePanel({ status, wild, selected, onGo, onPick }) {
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

export function StatusLine({ status }) {
  if (status.busy) return <span className="loading-pill">{status.text}</span>
  return <span className={`status${status.error ? ' error' : ''}`}>{status.text}</span>
}
