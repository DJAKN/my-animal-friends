// Distinct silhouette marks per demo species, so each roadside encounter is
// recognizable at a glance (no more "same bird emoji for everything"). Simple,
// calm, single-color forms consistent with the app's palette.

const INK = '#3f4a35'
const CROW = '#2f3630'
const HERON = '#8b96a0'
const TANUKI = '#9a7d5e'
const MAGPIE = '#6f8aa0'
const BULBUL = '#8a7256'
const KINGFISHER = '#2f7fa6'

function Crow(p) {
  return (
    <g {...p}>
      <ellipse cx="32" cy="40" rx="18" ry="11" fill={CROW} />
      <circle cx="46" cy="30" r="8" fill={CROW} />
      <path d="M52 29 l10 -2 -8 5 z" fill="#4a3f2f" />
      <path d="M16 40 q-12 2 -18 10 q14 -2 20 -4 z" fill={CROW} />
    </g>
  )
}
function Heron(p) {
  return (
    <g {...p}>
      <ellipse cx="30" cy="46" rx="15" ry="9" fill={HERON} />
      <path d="M38 44 C40 30 42 20 44 12" stroke={HERON} strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="45" cy="11" r="5" fill={HERON} />
      <path d="M49 10 l11 -1 -9 4 z" fill="#e0a54a" />
      <path d="M26 54 l-3 12 M32 54 l1 12" stroke="#c9a24a" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}
function Tanuki(p) {
  return (
    <g {...p}>
      <ellipse cx="32" cy="40" rx="20" ry="15" fill={TANUKI} />
      <circle cx="32" cy="30" r="15" fill="#b49778" />
      <path d="M20 20 l-4 -9 9 5 z M44 20 l4 -9 -9 5 z" fill="#7a6248" />
      <ellipse cx="25" cy="30" rx="5" ry="6" fill="#4a3c2c" />
      <ellipse cx="39" cy="30" rx="5" ry="6" fill="#4a3c2c" />
      <circle cx="25" cy="29" r="2" fill="#fff" />
      <circle cx="39" cy="29" r="2" fill="#fff" />
      <ellipse cx="32" cy="37" rx="3" ry="2" fill="#2e241a" />
    </g>
  )
}
function Magpie(p) {
  return (
    <g {...p}>
      <ellipse cx="30" cy="38" rx="14" ry="9" fill="#d8d2c4" />
      <circle cx="42" cy="30" r="8" fill={INK} />
      <path d="M48 29 l9 -2 -7 5 z" fill="#4a3f2f" />
      <path d="M18 40 q-16 6 -24 18 q18 -6 26 -10 z" fill={MAGPIE} />
    </g>
  )
}
function Bulbul(p) {
  return (
    <g {...p}>
      <ellipse cx="30" cy="40" rx="14" ry="10" fill={BULBUL} />
      <circle cx="42" cy="30" r="8" fill="#6e5b44" />
      <ellipse cx="38" cy="33" rx="3" ry="4" fill="#b07a55" />
      <path d="M43 22 l-2 -8 5 6 z" fill="#6e5b44" />
      <path d="M48 29 l9 -1 -7 4 z" fill="#4a3f2f" />
      <path d="M18 42 q-12 4 -18 12 q14 -4 20 -7 z" fill={BULBUL} />
    </g>
  )
}
function Kingfisher(p) {
  return (
    <g {...p}>
      <ellipse cx="30" cy="40" rx="13" ry="10" fill="#d98a3c" />
      <path d="M20 34 q6 -8 20 -6 q8 1 12 6 q-14 -3 -32 0 z" fill={KINGFISHER} />
      <circle cx="44" cy="30" r="8" fill={KINGFISHER} />
      <circle cx="46" cy="29" r="2.4" fill="#fff" />
      <path d="M50 30 l13 -1 -11 5 z" fill={INK} />
    </g>
  )
}

const MARKS = {
  'Corvus macrorhynchos': Crow,
  'Ardea cinerea': Heron,
  'Nyctereutes viverrinus': Tanuki,
  'Cyanopica cyanus': Magpie,
  'Hypsipetes amaurotis': Bulbul,
  'Alcedo atthis': Kingfisher,
}

export function AnimalMark({ sci, size = 64 }) {
  const Draw = MARKS[sci] || Crow
  return (
    <svg width={size} height={size} viewBox="0 0 64 72">
      <Draw />
    </svg>
  )
}
