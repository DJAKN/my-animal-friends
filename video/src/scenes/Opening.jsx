import { AbsoluteFill, Sequence, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion'
import '../../../app/src/index.css'
import './video.css'
import { HeaderBar, LayerToggles, NearbyPanel } from '../../../app/src/chrome.jsx'
import DetailCard from '../../../app/src/DetailCard.jsx'
import { HERO_ANIMAL, HERO_WIKI, NEARBY_STATUS } from '../fixture.js'

// A calm, map-like backdrop built from the app's own palette. (In the full
// pitch cut this layer is replaced by a Playwright-recorded live map.)
function MapBackdrop() {
  const frame = useCurrentFrame()
  const drift = interpolate(frame, [0, 260], [0, -30])
  return (
    <AbsoluteFill style={{ background: '#ece7d9', overflow: 'hidden' }}>
      <AbsoluteFill style={{ transform: `translateX(${drift}px)` }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', opacity: 0.5 }}>
          <g stroke="#f6f2e7" strokeWidth="26" fill="none">
            <path d="M-100 300 H2100 M-100 760 H2100 M520 -100 V1200 M1300 -100 V1200" />
          </g>
          <g fill="#dfe2cf" opacity="0.6">
            <circle cx="1500" cy="360" r="180" />
            <circle cx="360" cy="820" r="150" />
            <circle cx="1050" cy="560" r="120" />
          </g>
          <g fill="#cfd9c0" opacity="0.7">
            <circle cx="300" cy="300" r="70" />
            <circle cx="1650" cy="820" r="90" />
          </g>
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// A full-frame layer so the app's own absolute positioning places the component
// exactly where it sits in the real UI; the fly-in is a transform on the layer.
function Layer({ from, delay, zIndex, children }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.8 } })
  const off = { top: [0, -120], bottom: [0, 120], left: [-180, 0], right: [180, 0] }[from]
  const x = interpolate(p, [0, 1], [off[0], 0])
  const y = interpolate(p, [0, 1], [off[1], 0])
  const opacity = interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: 'clamp' })
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px)`, opacity, zIndex }}>
      {children}
    </AbsoluteFill>
  )
}

export function Opening() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  const spot = spring({ frame: frame - 150, fps, config: { damping: 200 } })
  const dim = interpolate(spot, [0, 1], [0, 0.4])

  const titleP = spring({ frame: frame - 198, fps, config: { damping: 200 } })
  const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })

  return (
    <AbsoluteFill style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', opacity: fadeOut }}>
      <MapBackdrop />

      <Layer from="top" delay={10} zIndex={1}><HeaderBar mode="nearby" onSwitch={() => {}} /></Layer>
      <Layer from="top" delay={26} zIndex={1}>
        <LayerToggles showWild showPlaces onWild={() => {}} onPlaces={() => {}} />
      </Layer>
      <Layer from="left" delay={44} zIndex={1}><NearbyPanel status={NEARBY_STATUS} onSearch={() => {}} /></Layer>

      {/* Spotlight dimmer: above the chrome, below the hero card */}
      <AbsoluteFill style={{ background: '#2e3626', opacity: dim, zIndex: 2, pointerEvents: 'none' }} />

      <Sequence from={110} style={{ zIndex: 3 }}>
        <HeroCardLayer />
      </Sequence>

      <div className="v-title" style={{ zIndex: 4, opacity: interpolate(titleP, [0, 1], [0, 1]), transform: `translate(-50%, ${interpolate(titleP, [0, 1], [20, 0])}px)` }}>
        <div className="v-title-main">My Animal Friends</div>
        <div className="v-title-sub">Explore the world you share with animals</div>
      </div>
    </AbsoluteFill>
  )
}

function HeroCardLayer() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const p = spring({ frame, fps, config: { damping: 200, mass: 0.9 } })
  const y = interpolate(p, [0, 1], [140, 0])
  const opacity = interpolate(p, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' })
  const lift = spring({ frame: frame - 40, fps, config: { damping: 200 } })
  const scale = interpolate(lift, [0, 1], [1, 1.05])
  return (
    <AbsoluteFill style={{ transform: `translateY(${y}px) scale(${scale})`, transformOrigin: 'top right', opacity, zIndex: 3 }}>
      <DetailCard item={HERO_ANIMAL} initialWiki={HERO_WIKI} onClose={() => {}} />
    </AbsoluteFill>
  )
}
