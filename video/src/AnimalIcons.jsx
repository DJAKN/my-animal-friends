// Hand-drawn minimal silhouettes for the flythrough's six species — each one
// distinct at a glance, in the app's calm palette. All face left (toward the
// road) inside a 100×100 viewBox.

function Crow() {
  return (
    <g>
      <ellipse cx="54" cy="58" rx="26" ry="17" fill="#3d4240" />
      <circle cx="32" cy="46" r="12" fill="#3d4240" />
      <path d="M21 46 L6 50 L22 53 Z" fill="#2e3331" />
      <path d="M76 50 L96 44 L80 62 Z" fill="#3d4240" />
      <circle cx="29" cy="43" r="1.8" fill="#d8d5c8" />
      <path d="M46 74 l-2 10 M60 74 l-2 10" stroke="#3d4240" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function Tanuki() {
  return (
    <g>
      <ellipse cx="52" cy="62" rx="28" ry="19" fill="#8a7a63" />
      <circle cx="30" cy="46" r="15" fill="#8a7a63" />
      <path d="M20 36 l-3 -9 8 4 Z M38 34 l2 -9 5 8 Z" fill="#6e6150" />
      <path d="M16 44 q14 -6 28 2 q-6 8 -13 7 q-9 0 -15 -9 Z" fill="#4a4238" />
      <circle cx="25" cy="46" r="2" fill="#f4efe1" />
      <circle cx="35" cy="47" r="2" fill="#f4efe1" />
      <ellipse cx="18" cy="54" rx="6" ry="4.5" fill="#c9bda6" />
      <ellipse cx="84" cy="56" rx="12" ry="8" fill="#6e6150" />
      <ellipse cx="90" cy="54" rx="6" ry="6" fill="#4a4238" />
      <path d="M40 79 l0 8 M56 79 l0 8" stroke="#6e6150" strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

function Heron() {
  return (
    <g>
      <ellipse cx="58" cy="52" rx="22" ry="14" fill="#9aa5ab" />
      <path d="M44 50 q-12 -2 -14 -16 q-1 -12 8 -14 q8 -1 8 8 l0 6" fill="none" stroke="#9aa5ab" strokeWidth="8" strokeLinecap="round" />
      <circle cx="37" cy="20" r="7.5" fill="#9aa5ab" />
      <path d="M30 20 L12 23 L30 26 Z" fill="#c9a86a" />
      <circle cx="35" cy="18" r="1.6" fill="#33393c" />
      <path d="M34 14 q4 -3 8 -1" stroke="#33393c" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M76 56 L92 48 L80 62 Z" fill="#818d94" />
      <path d="M52 65 l-1 22 M62 65 l1 22" stroke="#8a959b" strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

function Magpie() {
  return (
    <g>
      <ellipse cx="46" cy="52" rx="20" ry="13" fill="#cfd6da" />
      <circle cx="28" cy="42" r="10" fill="#41464a" />
      <path d="M19 42 L8 45 L20 48