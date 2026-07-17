import { useEffect, useState } from 'react'
import { fetchWikiSummary } from './api.js'
import { TAXON_META, COEXIST_TIPS, PLACE_META, CONSERVATION } from './content.js'

export default function DetailCard({ item, onClose }) {
  const [wiki, setWiki] = useState(null)

  useEffect(() => {
    setWiki(null)
    if (item?.kind === 'wild') {
      let alive = true
      fetchWikiSummary(item).then((w) => alive && setWiki(w))
      return () => { alive = false }
    }
  }, [item])

  if (!item) return null

  if (item.kind === 'place') {
    const meta = PLACE_META[item.type] || {}
    return (
      <aside className="detail glass">
        <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
        <div className="detail-photo-fallback">{meta.emoji || '🏡'}</div>
        <div className="detail-body">
          <h3>{item.name}</h3>
          <div className="badges"><span className="badge">{meta.label || 'Animal place'}</span></div>
          {item.openingHours && <p className="meta">Open: {item.openingHours}</p>}
          <div className="tip"><b>Visiting kindly</b>{meta.tip}</div>
          {item.website && <a className="more" href={item.website} target="_blank" rel="noreferrer">Visit website →</a>}
        </div>
      </aside>
    )
  }

  const taxon = TAXON_META[item.iconicTaxon] || TAXON_META.Unknown
  const cons = item.conservation ? CONSERVATION[item.conservation.toLowerCase()] : null
  return (
    <aside className="detail glass">
      <button className="detail-close" onClick={onClose} aria-label="Close">✕</button>
      {item.photoLarge
        ? <img className="detail-photo" src={item.photoLarge} alt={item.commonName} />
        : <div className="detail-photo-fallback">{taxon.emoji}</div>}
      <div className="detail-body">
        <h3>{item.commonName}</h3>
        <p className="sci">{item.sciName}</p>
        <div className="badges">
          <span className="badge">{taxon.emoji} {taxon.label}</span>
          {cons && <span className={`badge ${cons.tone}`}>{cons.label}</span>}
        </div>
        {wiki?.extract
          ? <p className="extract">{wiki.extract}</p>
          : <p className="extract" style={{ opacity: 0.55 }}>Gathering its story…</p>}
        <p className="meta">
          {item.count > 1
            ? `Generally seen around this area · ${item.count} recent sightings`
            : `Seen around here${item.observedOn ? ` · ${item.observedOn}` : ''}`}
        </p>
        <div className="tip">
          <b>Living alongside</b>
          {COEXIST_TIPS[item.iconicTaxon] || COEXIST_TIPS.Unknown}
        </div>
        <a className="more" href={wiki?.url || item.inatUrl} target="_blank" rel="noreferrer">
          Learn more →
        </a>
      </div>
    </aside>
  )
}
