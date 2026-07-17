export const TIME_BUCKETS = ['dawn', 'day', 'dusk', 'night']

const EMPHASIS = {
  diurnal: { dawn: 0.82, day: 1, dusk: 0.62, night: 0.35 },
  nocturnal: { dawn: 0.55, day: 0.35, dusk: 0.88, night: 1 },
  crepuscular: { dawn: 1, day: 0.48, dusk: 1, night: 0.62 },
  variable: { dawn: 0.8, day: 0.8, dusk: 0.8, night: 0.8 },
}

const TAXON_DEFAULTS = {
  Aves: 'diurnal',
  Mammalia: 'crepuscular',
  Reptilia: 'diurnal',
  Amphibia: 'nocturnal',
  Actinopterygii: 'variable',
  Insecta: 'variable',
  Arachnida: 'nocturnal',
  Mollusca: 'variable',
}

const SCIENTIFIC_OVERRIDES = new Map([
  ['ardea cinerea', 'diurnal'],
  ['sus scrofa leucomystax', 'crepuscular'],
])

const NAME_RULES = [
  { pattern: /owl|bat|raccoon/i, kind: 'nocturnal' },
  { pattern: /boar|fox|deer/i, kind: 'crepuscular' },
]

export function getActivityProfile(animal = {}) {
  const scientific = (animal.sciName || animal.scientificName || '').toLowerCase()
  const common = animal.commonName || ''
  const overridden = SCIENTIFIC_OVERRIDES.get(scientific)
    || NAME_RULES.find(({ pattern }) => pattern.test(common))?.kind
  const kind = overridden || TAXON_DEFAULTS[animal.iconicTaxon] || 'variable'
  return { kind }
}

export function activityEmphasis(profile, timeBucket) {
  return EMPHASIS[profile?.kind]?.[timeBucket] ?? EMPHASIS.variable[timeBucket] ?? 0.8
}

export function activityCopy(profile, timeBucket, season) {
  const kind = profile?.kind || 'variable'
  if (kind === 'variable') return `Activity varies by place and season. In ${season}, pause quietly and look for signs rather than expecting a sighting.`
  const matching = activityEmphasis({ kind }, timeBucket) >= 0.8
  return matching
    ? `${capitalize(kind)} animals are often active around ${timeBucket}, though every encounter depends on weather, habitat, and season.`
    : `${capitalize(kind)} animals are often quieter around ${timeBucket}. Their usual rhythm may be easier to notice at another time.`
}

export function getTimeBucket(date = new Date()) {
  const hour = date.getHours()
  if (hour >= 4 && hour < 8) return 'dawn'
  if (hour >= 8 && hour < 17) return 'day'
  if (hour >= 17 && hour < 20) return 'dusk'
  return 'night'
}

export function getSeason(date = new Date(), latitude = 0) {
  const month = date.getUTCMonth()
  const north = month >= 2 && month <= 4 ? 'spring'
    : month >= 5 && month <= 7 ? 'summer'
    : month >= 8 && month <= 10 ? 'autumn'
    : 'winter'
  if (latitude >= 0) return north
  return { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' }[north]
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
