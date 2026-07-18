import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Easing } from 'remotion'
import '../../../app/src/index.css'
import './video.css'
import {
  ROUTE_LENGTH, DRAWABLE_LENGTH, posAt, bearingAt, ENCOUNTER_WORLD,
  START_LABEL, END_LABEL,
} from '../route.js'
import { AnimalMark } from '../animalMarks.jsx'

// ——— Perspective tuning (real metres) ———
// A long focal length keeps the perspective gentle, so the world scales up
// slowly as you approach — the main cure for motion sickness.
const HORIZON_RATIO = 0.46
const FOCAL = 95
const KX = 50
const ROAD_HALF = 7
const LOOKAHEAD = 620
const PROP_STEP = 34      // metres between roadside trees (wider = calmer flow)
const DASH_GAP = 20       // metres between centre-line dashes

// ——— Camera speed schedule ———
// The camera eases to a near-stop as it reaches each animal, dwells, then
// resumes — so every encounter gets a few seconds of screen time instead of a
// sub-second flash. Built as a smooth speed field integrated to arc length.
const SIGMA = 250         // metres; width of each slow-down zone
const SLOW = 0.74         // depth of slow-down (speed dips to ~0.26x)
const SCHEDULE = (() => {
  const step = 3
  const s = []
  const Tc = [0]
  const speedAt = (x) => {
    let dip = 0
    for (const e of ENCOUNTER_WORLD) dip += SLOW * Math.exp(-(((x - e.s) / SIGMA) ** 2))
    return Math.max(0.26, 1 - dip)
  }
  for (let x = 0; x <= ROUTE_LENGTH; x += step) {
    s.push(x)
    if (x > 0) Tc.push(Tc[Tc.length - 1] + step / speedAt(x))
  }
  const total = Tc[Tc.length - 1]
  return { s, Tc, total, step }
})()

function arcLengthAtProgress(u) {
  const target = u * SCHEDULE.total
  const { Tc, s } = SCHEDULE
  let lo = 0
  let hi = Tc.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (Tc[mid] < target) lo = mid + 1
    else hi = mid
  }
  const i = Math.max(1, lo)
  const f = (target - Tc[i - 1]) / (Tc[i] - Tc[i - 1] || 1)
  return s[i - 1] + (s[i] - s[i - 1]) * f
}

// Roadside props fixed in the world so they flow toward the camera.
const PROPS = (() => {
  const out = []
  let seed = 7
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
  for (let s = 20; s < DRAWABLE_LENGTH; s += PROP_STEP) {
    for (const side of [-1, 1]) out.push({ s, side, off: 11 + rand() * 12, r: 2 + rand() * 2.4, tone: rand() })
  }
  return out
})()

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
          <rect key={i} x={b.x} y={horizon - b.h} width={b.w} height={b.h} rx="2" fill={b.tone > 0.5 ? '#8a9a7c' : '#9aa88c'} />
        ))}
      </g>
    </svg>
  )
}

function makeProjector(camPos, bearing, W, H) {
  const cx = W / 2
  const horizon = H * HORIZON_RATIO
  const bottomY = H * 1.16
  const cosB = Math.cos(bearing)
  const sinB = Math.sin(bearing)
  return function project(world) {
    const dx = world.x - camPos.x
    const dy = world.y - camPos.y
    const forward = dx * cosB + dy * sinB
    if (forward < 1) return null
    const lateral = -dx * sinB + dy * cosB
    const p = FOCAL / (FOCAL + forward)
    return { sx: cx - lateral * KX * p, sy: horizon + (bottomY - horizon) * p, p, forward }
  }
}

export function RouteFlythrough() {
  const frame = useCurrentFrame()
  const { fps, durationInFrames, width: W, height: H } = useVideoConfig()

  // Gentle ease only at the very start and end; the middle is paced by the
  // speed schedule (which already slows for each animal).
  const uRaw = interpolate(frame, [18, durationInFrames - 24], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const u = interpolate(uRaw, [0, 0.06, 0.94, 1], [0, 0.06, 0.94, 1], { easing: Easing.inOut(Easing.ease) })
  const sCam = arcLengthAtProgress(u)
  const camPos = posAt(sCam)
  const bearing = bearingAt(sCam)
  const project = makeProjector(camPos, bearing, W, H)
  const horizon = H * HORIZON_RATIO

  // Road ribbon.
  const left = []
  const right = []
  for (let d = 2; d <= LOOKAHEAD; d += 6) {
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
  const roadPoly = [...left, ...right.slice().reverse()].map((q) => `${q.sx.toFixed(1)},${q.sy.toFixed(1)}`).join(' ')

  const dashes = []
  for (let k = 0; k < 60; k++) {
    const s = Math.ceil(sCam / DASH_GAP) * DASH_GAP + k * DASH_GAP
    if (s > sCam + LOOKAHEAD) break
    const a = project(posAt(s - 2))
    const b = project(posAt(s + 2))
    if (a && b) dashes.push({ a, b })
  }

  const props = []
  for (const pr of PROPS) {
    if (pr.s < sCam - 8 || pr.s > sCam + LOOKAHEAD) continue
    const c = posAt(pr.s)
    const b = bearingAt(pr.s)
    const q = project({ x: c.x + -Math.sin(b) * pr.side * pr.off, y: c.y + Math.cos(b) * pr.side * pr.off })
    if (q && q.p > 0.09) props.push({ q, pr })
  }
  props.sort((a, b) => a.q.p - b.q.p)

  // Encounters — visible from far, dwelling as the camera slows near them.
  const encs = []
  let passing = null
  for (const e of ENCOUNTER_WORLD) {
    const q = project(e.world)
    if (!q || q.forward > LOOKAHEAD) continue
    const appear = interpolate(q.forward, [LOOKAHEAD * 0.62, LOOKAHEAD], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const pass = interpolate(q.forward, [3, 10], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    const opacity = Math.min(appear, pass)
    if (opacity > 0.05) encs.push({ e, q, opacity })
    if (q.forward < 220 && (!passing || q.forward < passing.q.forward)) passing = { e, q }
  }
  encs.sort((a, b) => a.q.p - b.q.p)

  const progressPct = Math.round((sCam / ROUTE_LENGTH) * 100)
  const fadeIn = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' })
  const fadeOut = interpolate(frame, [durationInFrames - 22, durationInFrames], [1, 0], { extrapolateLeft: 'clamp' })
  const arrived = progressPct >= 99

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut, fontFamily: 'ui-sans-serif, system-ui, sans-serif', overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: 'linear-gradient(#eef1e6 0%, #e7ecdb 55%, #dfe6d0 100%)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: horizon, bottom: 0, background: 'linear-gradient(#cdd8bd 0%, #c3d0b0 40%, #bacca6 100%)' }} />
      <Skyline bearing={bearing} bearing0={bearingAt(0)} W={W} horizon={horizon} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: horizon - 40, height: 90, background: 'linear-gradient(rgba(238,241,230,0) 0%, rgba(238,241,230,0.7) 55%, rgba(238,241,230,0) 100%)' }} />

      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        <polygon points={roadPoly} fill="#b7ac97" opacity="0.96" />
        <polyline points={left.map((q) => `${q.sx},${q.sy}`).join(' ')} fill="none" stroke="#cfc6b1" strokeWidth="3" opacity="0.8" />
        <polyline points={right.slice().reverse().map((q) => `${q.sx},${q.sy}`).join(' ')} fill="none" stroke="#cfc6b1" strokeWidth="3" opacity="0.8" />
        {dashes.map((d, i) => (
          <line key={i} x1={d.a.sx} y1={d.a.sy} x2={d.b.sx} y2={d.b.sy} stroke="#f4efe1" strokeWidth={Math.max(1, 6 * d.a.p)} strokeLinecap="round" opacity="0.85" />
        ))}
        {props.map(({ q, pr }, i) => {
          const r = pr.r * KX * q.p
          return (
            <g key={i} opacity={Math.min(0.95, Math.max(0, (q.p - 0.09) * 5))}>
              <ellipse cx={q.sx} cy={q.sy} rx={r} ry={r * 0.5} fill="#8ea07d" opacity="0.3" />
              <circle cx={q.sx} cy={q.sy - r} r={r} fill={pr.tone > 0.5 ? '#7d9268' : '#8fa576'} />
            </g>
          )
        })}
      </svg>

      {encs.map(({ e, q, opacity }) => {
        const size = Math.max(64, 300 * q.p)
        return (
          <div key={e.id} style={{ position: 'absolute', left: q.sx, top: q.sy, transform: 'translate(-50%, -100%)', opacity, zIndex: Math.round(q.p * 100) }}>
            {q.forward < LOOKAHEAD * 0.5 && (
              <div className="fly-label glass" style={{ transform: `scale(${Math.min(1.05, q.p * 2.2)})` }}>
                <span className="fly-name">{e.commonName}</span>
                <span className="fly-sci">{e.sciName}</span>
              </div>
            )}
            <div className="fly-halo" style={{ width: size, height: size }}>
              <div className="fly-mark" style={{ width: size * 0.66, height: size * 0.66 }}>
                <AnimalMark sci={e.sciName} size={size * 0.5} />
              </div>
            </div>
          </div>
        )
      })}

      <div className="banner glass" style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', zIndex: 500 }}>
        {arrived
          ? `🌿 Arriving in ${END_LABEL} — six neighbors met along the way`
          : passing
            ? `🌿 Now passing · ${passing.e.commonName}`
            : `🌿 Along your way, ${START_LABEL} → ${END_LABEL} — six neighbors live beside this road`}
      </div>

      <div className="fly-progress glass">
        <span className="fly-city">{START_LABEL}</span>
        <div className="fly-track"><div className="fly-fill" style={{ width: `${progressPct}%` }} /></div>
        <span className="fly-city">{END_LABEL}</span>
      </div>
    </AbsoluteFill>
  )
}
