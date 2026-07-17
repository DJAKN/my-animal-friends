import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import '../../../app/src/index.css'
import './video.css'
import {
  ROUTE_LENGTH, posAt, bearingAt, ENCOUNTER_WORLD, START_LABEL, END_LABEL,
} from '../route.js'

// ——— Perspective tuning ———
const HORIZON_RATIO = 0.44
const FOCAL = 48        // metres; smaller = stronger perspective
const KX = 34           // px per lateral metre at the near plane
const ROAD_HALF = 5.5   // metres, half road width
const LOOKAHEAD = 320   // metres of road drawn ahead
const EYE_LATERAL = 0   // camera sits on the centre line

// Hazy Tokyo skyline seed (procedural buildings along the horizon).
const SKYLINE = (() => {
  const out = []
  let seed = 31
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  let x = -600
  while (x < 3000) {
    const w = 26 + rand() * 60
    out.push({ x, w, h: 34 + rand() * 150, tone: rand() })
    x += w + 6 + rand() * 20
  }
  return out
})()

function Skyline({ bearing, bearing0, W, horizon }) {
  const shift = Math.max(-500, Math.min(500, -(bearing - bearing0) * 1400))
  return (
    <svg width={W} height={horizon + 4} style={{ position: 'absolute', top: 0, left: 0 }}>
      <g transform={`translate(${shift - 300}, 0)`} opacity="0.22">
        {SKYLINE.map((b, i) => (
          <rect key={i} x={b.x} y={horizon - b.h} width={b.w} height={b.h} rx="2"
            fill={b.tone > 0.5 ? '#8a9a7c' : '#9aa88c'} />
        ))}
      </g>
    </svg>
  )
}

// Fixed-in-world roadside props (trees/shrubs) so they flow toward the camera.
const PROPS = (() => {
  const out = []
  let seed = 7
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  for (let s = 20; s < ROUTE_LENGTH; s += 17) {
    for (const side of [-1, 1]) {
      out.push({ s, side, off: 10 + rand() * 10, r: 1.5 + rand() * 1.6, tone: rand() })
    }
  }
  return out
})()

function makeProjector(camPos, bearing, W, H) {
  const cx = W / 2
  const horizon = H * HORIZON_RATIO
  const bottomY = H * 1.18
  const cosB = Math.cos(bearing)
  const sinB = Math.sin(bearing)
  return function project(world) {
    const dx = world.x - camPos.x
    const dy = world.y - camPos.y
    const forward = dx * cosB + dy * sinB
    if (forward < 1) return null
    const lateral = -dx * sinB + dy * cosB - EYE_LATERAL
    const p = FOCAL / (FOCAL + forward)
    return {
      sx: cx - lateral * KX * p,
      sy: horizon + (bottomY - horizon) * p,
      p,
      forward,
    }
  }
}

export function RouteFlythrough() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width: W, height: H } = useVideoConfig()

  // Ease the camera from start to end along the route; hold briefly at each end.
  const travel = interpolate(frame, [24, durationInFrames - 18], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  })
  const sCam = travel * ROUTE_LENGTH
  const camPos = posAt(sCam)
  const bearing = bearingAt(sCam + 6)
  const project = makeProjector(camPos, bearing, W, H)
  const horizon = H * HORIZON_RATIO

  // Road ribbon polygon (left edge forward, right edge back).
  const left = []
  const right = []
  const centerDashes = []
  for (let d = 2; d <= LOOKAHEAD; d += 4) {
    const s = sCam + d
    const c = posAt(s)
    const b = bearingAt(s)
    const nx = -Math.sin(b)
    const ny = Math.cos(b)
    const lp = project({ x: c.x + nx * ROAD_HALF, y: c.y + ny * ROAD_HALF })
    const rp = project({ x: c.x - nx * ROAD_HALF, y: c.y - ny * ROAD_HALF })
    if (lp) left.push(lp)
    if (rp) right.push(rp)
  }
  const roadPoly = [...left, ...right.reverse()].map((q) => `${q.sx.toFixed(1)},${q.sy.toFixed(1)}`).join(' ')

  // Centre-line dashes at fixed world positions → they flow toward the camera.
  const gap = 9
  for (let k = 0; k < 40; k++) {
    const s = Math.ceil(sCam / gap) * gap + k * gap
    if (s > sCam + LOOKAHEAD) break
    const a = project(posAt(s - 1.4))
    const b = project(posAt(s + 1.4))
    if (a && b) centerDashes.push({ a, b })
  }

  // Roadside props near the camera.
  const props = []
  for (const pr of PROPS) {
    if (pr.s < sCam - 6 || pr.s > sCam + LOOKAHEAD) continue
    const c = posAt(pr.s)
    const b = bearingAt(pr.s)
    const nx = -Math.sin(b) * pr.side
    const ny = Math.cos(b) * pr.side
    const q = project({ x: c.x + nx * pr.off, y: c.y + ny * pr.off })
    if (q && q.p > 0.1) props.push({ q, pr })
  }
  props.sort((a, b) => a.q.p - b.q.p)

  // Encounters near the camera — visible from far, until they sweep past.
  const encs = []
  for (const e of ENCOUNTER_WORLD) {
    const q = project(e.world)
    if (!q || q.forward > LOOKAHEAD) continue
    const appear = interpolate(q.forward, [LOOKAHEAD * 0.72, LOOKAHEAD], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const pass = interpolate(q.forward, [4, 11], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    encs.push({ e, q, opacity: Math.min(appear, pass) })
  }
  encs.sort((a, b) => a.q.p - b.q.p)

  const progressPct = Math.round(travel * 100)
  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [durationInFrames - 16, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut, fontFamily: 'ui-sans-serif, system-ui, sans-serif', overflow: 'hidden' }}>
      {/* Sky */}
      <AbsoluteFill style={{ background: 'linear-gradient(#eef1e6 0%, #e7ecdb 55%, #dfe6d0 100%)' }} />
      {/* Ground */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0, background: 'linear-gradient(#cdd8bd 0%, #c3d0b0 40%, #bacca6 100%)' }} />
      {/* Distant Tokyo skyline */}
      <Skyline bearing={bearing} bearing0={bearingAt(6)} W={W} horizon={horizon} />
      {/* Distance haze at the horizon */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: horizon - 40, height: 90, background: 'linear-gradient(rgba(238,241,230,0) 0%, rgba(238,241,230,0.7) 55%, rgba(238,241,230,0) 100%)' }} />

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {/* Road surface */}
        <polygon points={roadPoly} fill="#b7ac97" opacity="0.96" />
        {/* Soft road edges */}
        <polyline points={left.map((q) => `${q.sx},${q.sy}`).join(' ')} fill="none" stroke="#cfc6b1" strokeWidth="3" opacity="0.8" />
        <polyline points={right.slice().reverse().map((q) => `${q.sx},${q.sy}`).join(' ')} fill="none" stroke="#cfc6b1" strokeWidth="3" opacity="0.8" />
        {/* Centre dashes */}
        {centerDashes.map((d, i) => (
          <line key={i} x1={d.a.sx} y1={d.a.sy} x2={d.b.sx} y2={d.b.sy} stroke="#f4efe1" strokeWidth={Math.max(1, 5 * d.a.p)} strokeLinecap="round" opacity="0.85" />
        ))}
        {/* Roadside props */}
        {props.map(({ q, pr }, i) => {
          const r = pr.r * KX * q.p
          return (
            <g key={i} opacity={Math.min(0.95, Math.max(0, (q.p - 0.1) * 5))}>
              <ellipse cx={q.sx} cy={q.sy} rx={r} ry={r * 0.5} fill="#8ea07d" opacity="0.3" />
              <circle cx={q.sx} cy={q.sy - r} r={r} fill={pr.tone > 0.5 ? '#7d9268' : '#8fa576'} />
            </g>
          )
        })}
      </svg>

      {/* Encounter markers — real animals surfacing along the road */}
      {encs.map(({ e, q, opacity }) => {
        const size = Math.max(30, 150 * q.p)
        return (
          <div key={e.id} style={{ position: 'absolute', left: q.sx, top: q.sy, transform: 'translate(-50%, -100%)', opacity, zIndex: Math.round(q.p * 100) }}>
            {q.forward < 95 && (
              <div className="fly-label glass" style={{ transform: `scale(${Math.min(1, q.p * 1.6)})` }}>
                <span className="fly-name">{e.commonName}</span>
                <span className="fly-sci">{e.sciName}</span>
              </div>
            )}
            <div className="fly-halo" style={{ width: size, height: size }}>
              <div className="fly-emoji" style={{ fontSize: size * 0.5 }}>{e.emoji}</div>
            </div>
          </div>
        )
      })}

      {/* HUD */}
      <div className="banner glass" style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
        🌿 Along your way, {START_LABEL} → {END_LABEL} — six neighbors live beside this road
      </div>

      <div className="fly-progress glass">
        <span className="fly-city">{START_LABEL}</span>
        <div className="fly-track"><div className="fly-fill" style={{ width: `${progressPct}%` }} /></div>
        <span className="fly-city">{END_LABEL}</span>
      </div>
    </AbsoluteFill>
  )
}
