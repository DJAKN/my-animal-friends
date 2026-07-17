import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { TAXON_META, PLACE_META } from './content.js'
import { activityEmphasis, getActivityProfile } from './activity.js'

// Imperative Leaflet wrapper. Marker layers are cheap to rebuild (<100 items),
// so we regenerate them whenever the data or selection changes.
export default function MapView({ view, user, wild, places, route, showWild, showPlaces, selectedId, onSelect, timeBucket }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef(null)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const hasFlownRef = useRef(false)

  useEffect(() => {
    const map = L.map(elRef.current, { zoomControl: false })
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a> · wildlife data <a href="https://www.inaturalist.org">iNaturalist</a>',
      maxZoom: 19,
    }).addTo(map)
    map.setView([35.68, 139.76], 12)
    layersRef.current = {
      route: L.layerGroup().addTo(map),
      wild: L.layerGroup().addTo(map),
      places: L.layerGroup().addTo(map),
      user: L.layerGroup().addTo(map),
    }
    mapRef.current = map
    return () => map.remove()
  }, [])

  // Camera moves: {center:[lat,lng], zoom} or {bounds:[[..],[..]]}
  // The very first move lands before the container has been through a layout
  // pass, which can make Leaflet's fly animation compute NaN — jump straight
  // there instead (there's nothing to animate *from* yet anyway).
  useEffect(() => {
    const map = mapRef.current
    if (!map || !view) return
    const first = !hasFlownRef.current
    hasFlownRef.current = true
    if (view.bounds) {
      if (first) map.fitBounds(view.bounds, { padding: [70, 70] })
      else map.flyToBounds(view.bounds, { padding: [70, 70], duration: 1.2 })
    } else if (view.center) {
      if (first) map.setView(view.center, view.zoom ?? 13)
      else map.flyTo(view.center, view.zoom ?? 13, { duration: 1.2 })
    }
  }, [view])

  // User location dot
  useEffect(() => {
    const g = layersRef.current?.user
    if (!g) return
    g.clearLayers()
    if (user) {
      L.marker([user.lat, user.lng], {
        icon: L.divIcon({ className: 'you-wrap', html: '<div class="you-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
        interactive: false,
        zIndexOffset: 500,
      }).addTo(g)
    }
  }, [user])

  // Wild animals — a soft "distribution cloud" (range in meters) with the species
  // photo floating at its centre. Conveys general presence, not a precise pin.
  useEffect(() => {
    const g = layersRef.current?.wild
    if (!g) return
    g.clearLayers()
    if (!showWild) return
    for (const s of wild) {
      const sel = s.id === selectedId
      const emphasis = activityEmphasis(getActivityProfile(s), timeBucket)
      if (s.spreadM) {
        L.circle([s.lat, s.lng], {
          radius: s.spreadM,
          stroke: sel,
          color: '#7d8f70',
          weight: 1.5,
          fillColor: '#7d8f70',
          fillOpacity: sel ? 0.22 : 0.13,
          className: 'wild-range',
          interactive: false,
        }).addTo(g)
      }
      const fallback = TAXON_META[s.iconicTaxon]?.emoji || '🐾'
      const inner = s.photo
        ? `<div class="wild-thumb" style="background-image:url('${s.photo}')"></div>`
        : `<div class="wild-thumb">${fallback}</div>`
      const count = s.count > 1 ? `<span class="wild-count">${s.count}</span>` : ''
      const icon = L.divIcon({
        className: 'wild-wrap',
        html: `<div class="halo-marker${sel ? ' selected' : ''}">${inner}${count}</div>`,
        iconSize: [52, 52],
        iconAnchor: [26, 26],
      })
      L.marker([s.lat, s.lng], {
        icon,
        title: s.commonName,
        alt: s.commonName,
        opacity: sel ? 1 : emphasis,
        zIndexOffset: sel ? 400 : 100 + Math.round(emphasis * 100),
      })
        .on('click', () => onSelectRef.current(s))
        .addTo(g)
    }
  }, [wild, showWild, selectedId, timeBucket])

  // Animal place markers — small icon badges
  useEffect(() => {
    const g = layersRef.current?.places
    if (!g) return
    g.clearLayers()
    if (!showPlaces) return
    for (const p of places) {
      const emoji = PLACE_META[p.type]?.emoji || '🏡'
      const sel = p.id === selectedId ? ' selected' : ''
      const icon = L.divIcon({
        className: 'place-wrap',
        html: `<div class="place-badge${sel}">${emoji}</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })
      L.marker([p.lat, p.lng], { icon, title: p.name, alt: p.name, zIndexOffset: sel ? 400 : 200 })
        .on('click', () => onSelectRef.current(p))
        .addTo(g)
    }
  }, [places, showPlaces, selectedId])

  // Route polyline — soft green with a wide glow casing
  useEffect(() => {
    const g = layersRef.current?.route
    if (!g) return
    g.clearLayers()
    if (route?.latlngs) {
      L.polyline(route.latlngs, { color: '#7d8f70', weight: 12, opacity: 0.25, lineCap: 'round' }).addTo(g)
      L.polyline(route.latlngs, { color: '#55654c', weight: 4.5, opacity: 0.85, lineCap: 'round' }).addTo(g)
    }
  }, [route])

  return <div className="map" ref={elRef} />
}
