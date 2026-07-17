// Curated static copy: coexistence tips, gentle facts, and place metadata.

export const TAXON_META = {
  Mammalia: { emoji: '🦝', label: 'Mammal' },
  Aves: { emoji: '🐦', label: 'Bird' },
  Reptilia: { emoji: '🦎', label: 'Reptile' },
  Amphibia: { emoji: '🐸', label: 'Amphibian' },
  Actinopterygii: { emoji: '🐟', label: 'Fish' },
  Mollusca: { emoji: '🐌', label: 'Mollusc' },
  Insecta: { emoji: '🦋', label: 'Insect' },
  Arachnida: { emoji: '🕷️', label: 'Arachnid' },
  Unknown: { emoji: '🐾', label: 'Animal' },
}

export const COEXIST_TIPS = {
  Mammalia: 'Observe from a distance and never feed wild mammals — human food changes their behavior and can make them sick.',
  Aves: 'Keep quiet near nesting spots and keep cats indoors during fledgling season — small habits that save many birds.',
  Reptilia: 'Reptiles bask to survive. If you meet one on a path, simply walk around it and let it keep its warmth.',
  Amphibia: 'Amphibians breathe through their skin — never handle them with sunscreen or bug spray on your hands.',
  Actinopterygii: 'Healthy waterways start on land: whatever enters a street drain often ends up where fish live.',
  Mollusca: 'Slow neighbors underfoot — watch your step on damp evenings and leave shells where you find them.',
  Insecta: 'A corner of unmown grass or a few native flowers turns any yard into an insect refuge.',
  Arachnida: 'Spiders are quiet pest control. Relocate gently with a cup and paper instead of harming them.',
  Unknown: 'Watch quietly, keep your distance, and leave the place as you found it — the kindest way to say hello.',
}

export const PLACE_META = {
  zoo: { emoji: '🦁', label: 'Zoo / wildlife park', tip: 'Good zoos fund conservation. Visit calmly, skip flash photos, and let animals choose to come close.' },
  aquarium: { emoji: '🐠', label: 'Aquarium', tip: 'Tapping on glass startles fish — press a finger gently and wait; many curious species will come to you.' },
  bird_hide: { emoji: '🦉', label: 'Bird hide', tip: 'Move slowly, speak in whispers, and the birds will forget you are there.' },
  cafe: { emoji: '🐈', label: 'Animal cafe', tip: 'Let animals approach you first, and choose cafes that give their residents space and rest time.' },
  farm: { emoji: '🐄', label: 'Farm', tip: 'Farm animals are curious and social — move calmly, ask before feeding, and wash your hands after visiting.' },
}

export const FACTS = [
  'Raccoon dogs (tanuki) pair for life and raise their pups together.',
  'A single urban park can host over 100 bird species across a year.',
  'Crows recognize individual human faces — and remember kindness.',
  'Hedgehogs walk up to 3 km every night through connected gardens.',
  'Sea otters hold hands while sleeping so they don’t drift apart.',
  'City foxes and country foxes sing to each other in different “dialects”.',
  'Butterflies taste with their feet — every landing is a little tasting.',
  'Sparrows take dust baths to stay clean — that flutter in the dirt is spa time.',
]

export const CONSERVATION = {
  lc: { label: 'Least Concern', tone: 'calm' },
  nt: { label: 'Near Threatened', tone: 'warm' },
  vu: { label: 'Vulnerable', tone: 'warm' },
  en: { label: 'Endangered', tone: 'strong' },
  cr: { label: 'Critically Endangered', tone: 'strong' },
  ew: { label: 'Extinct in the Wild', tone: 'strong' },
  ex: { label: 'Extinct', tone: 'strong' },
}
