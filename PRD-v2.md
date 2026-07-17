# My Animal Friends — PRD v2: Two Signature Features

> Follow-on to [PRD.md](PRD.md). Adds depth (an AI companion) and sensory /
> temporal richness (sound + time-of-day) while keeping the calm, map-first
> feel intact. Still pure frontend, still key-less by default, still demo-first.

## Why these two

The v1 app is spatial and static: animals are points you tap. These two
features add the missing dimensions:

- **Feature 1 — AI Nature Walk** gives the product *narrative intelligence*:
  it weaves scattered animal presences into a single, gentle guided stroll.
  This is the "complex / fancy" showcase (the only LLM-powered surface).
- **Feature 2 — Living Soundscape + Time Lens** gives the product *senses and
  rhythm*: you hear the real animals, and you see who stirs at dawn, day, dusk
  and night. This is the emotional, sensory showcase.

Both reinforce the core message — that we share the world with animals, and
that coexistence begins with slowing down, listening, and understanding their
lives.

---

## Feature 1 — AI Nature Walk (guided companion)

### Concept
From wherever the user is looking, the app composes a short, walkable loop
that connects a handful of nearby animal presences and animal places, and
narrates it in a warm field-guide voice — a calm "nature walk you can actually
take", not a list of pins.

### User stories
1. "From my spot, compose me a gentle walk that passes a few animals, and tell
   me what to look and listen for along the way."
2. "As I read the itinerary, tapping a stop pans the map there and shows that
   animal's card, so the walk and the map move together."
3. "The narration feels human and calm — it respects the animals and teaches
   me something, without urgency or gimmicks."

### UX / UI integration
- **New third mode in the existing header switch:** `Nearby · Route · Walk`.
  Walk mode reuses the same map; no new screens.
- **Left panel (Walk):** a single soft primary button — **"Compose my walk"** —
  with one line of hint copy. On tap it shows a calm loading line
  ("Composing a quiet loop for you…") then becomes a **scrollable narrated
  itinerary**: numbered stops, each a small card with the species thumbnail,
  its name, and 1–2 sentences of Claude-written narration ("Stop 2 · pause by
  the canal — a grey heron often stands motionless here at the water's edge;
  keep your voice low and you may watch it fish.").
- **On the map:** the walking loop is drawn as a **soft dotted path** (distinct
  from the solid Route polyline), with small numbered dots at each stop. Reuses
  the existing calm styling language.
- **Stop ↔ map linkage:** tapping an itinerary stop pans/zooms and opens that
  animal's existing detail card. Same interaction grammar as Route encounters.
- **Header/footer:** a one-line ambient summary in the banner slot
  ("A 25-minute loop past 4 neighbors — take your time").

### Data & tech
- **Stops:** pick 3–5 nearby items (mix of wild species + one animal place if
  present), ordered into a loop by nearest-neighbor from the start point.
- **Path:** OSRM **foot** profile (`/route/v1/foot/...`) through the ordered
  stops and back, drawn as the dotted walk line. (Falls back to straight soft
  connectors if foot routing is unavailable.)
- **Narration:** Claude API (`claude-sonnet-5` via the Messages API). A single
  request receives the ordered stops (names, taxa, coexistence tips, distances)
  and returns a small JSON of per-stop narration + an intro line. Prompt is
  constrained to a calm, respectful, concrete field-guide voice.
- **Key handling (honest hackathon shortcut):** if `VITE_ANTHROPIC_API_KEY` is
  set, narration is generated live by Claude. If not, a **built-in template
  composer** produces still-lovely narration from the same structured data
  (species facts + tips + distances). So the feature always works with zero
  config, and shines when the key is present. *(Browser-side key is a demo-only
  shortcut; a 10-line serverless proxy is the production path — noted, not built.)*

### Scope
- P0: Walk mode, Compose button, ordered stops, dotted loop on map, narrated
  itinerary, stop↔card linkage, template fallback.
- P1: Live Claude narration when key present; intro/summary line; walk duration
  estimate from foot route.
- Non-goals: turn-by-turn navigation, saving walks, multi-day trips.

### Demo moment
"Compose my walk" → within a second or two a dotted loop blooms on the map and
a narrated itinerary writes itself — a personal, AI-authored nature stroll.

---

## Feature 2 — Living Soundscape + Time Lens

Two tightly-related additions: you can **hear** each animal, and you can see
the neighborhood **change through the day**.

### 2A · Living Soundscape (real animal calls)

**Concept:** the detail card can play the animal's *real* recorded call, so
meeting a grey heron means hearing a grey heron.

**User story:** "When I open an animal, I can tap a soft *Listen* and hear its
actual call — it makes the encounter real and moving."

**UX / UI integration:**
- A small **"🔊 Listen"** pill inside the existing detail card, beside the
  taxon badge. Tapping plays a gentle recording; tapping again pauses. Closing
  the card stops playback. No autoplay — sound is always user-initiated (calm).
- A subtle waveform/pulse animation on the pill while playing, in sage tones.

**Data & tech:**
- **xeno-canto API** (free, no key): `GET xeno-canto.org/api/2/recordings?query=<scientific name> q:A`
  → pick a high-quality recording, play its `file` URL in an `<audio>` element.
- Mostly birds (xeno-canto's strength) plus some frogs/insects/mammals; if no
  recording exists, the pill simply doesn't appear (fails soft).

### 2B · Time Lens (time-of-day dimension)

**Concept:** a slim time ribbon that reveals the neighborhood's daily rhythm —
who is active at **Dawn · Day · Dusk · Night** — teaching that coexistence
means understanding animals' schedules.

**User story:** "I slide to Dusk and the map softly settles into evening — the
raccoon dogs and owls glow awake while daytime birds fade — and a line tells me
'Dusk chorus — 3 neighbors stirring.'"

**UX / UI integration:**
- A **slim horizontal ribbon** centered at the bottom (above the "Did you know?"
  fact), four calm segments: `Dawn · Day · Dusk · Night`, defaulting to the
  real current period from the device clock.
- Selecting a period gently adjusts the map: wild markers **active** in that
  period stay bright; **inactive** ones fade to a soft ghost opacity (they don't
  disappear — they're just resting). A one-line label updates
  ("Dusk chorus — 3 neighbors stirring").
- Optional very-subtle map tint shift per period (warm dawn, cool night) via a
  CSS overlay — keeps it atmospheric, never garish.

**Data & tech:**
- **Activity model:** a curated `ACTIVITY_BY_TAXON` map (crepuscular mammals →
  dawn/dusk; owls → night; most birds → day; etc.), keyed by iconic taxon with a
  few species overrides. Deterministic, no flaky per-observation timestamps
  needed. (iNaturalist observation hour is available but sparse; the curated
  model is more reliable and more teachable for the demo.)
- Pure client-side opacity + label recompute on period change; no refetch.

**Scope:**
- P0: Listen pill in detail card (xeno-canto); Time ribbon with 4 periods,
  marker fade + active-count label, default to current period.
- P1: per-period map tint; a "Dusk chorus" ambient blend of 2–3 active species'
  calls at low volume (user-initiated).
- Non-goals: seasonal migration modeling, precise sunrise/sunset per lat/long
  (approximate periods are enough), full soundscape mixing desk.

### Demo moment
Open a heron → tap Listen → its real call plays. Slide to Dusk → the map
breathes into evening, nocturnal neighbors wake, and the chorus line appears.

---

## Where everything lives (UI map)

```
┌─────────────────────────────────────────────────────────────┐
│ [🦝 Brand] [Nearby · Route · Walk]          [🐾 Wild][🏡 Places] │  ← mode gains "Walk" (F1)
│                                                               │
│  ┌── Left panel ──┐                      ┌── Detail card ──┐  │
│  │ Nearby: search │                      │ photo, names    │  │
│  │ Route:  A→B +  │                      │ [taxon][🔊Listen]│ │  ← Listen pill (F2A)
│  │         list   │        MAP           │ summary + tip   │  │
│  │ Walk:  Compose │   (clouds, pins,     └─────────────────┘  │
│  │        + narra-│    route, + dotted                        │
│  │        ted     │    walk loop F1)                          │
│  │        itinerary│                                          │
│  └────────────────┘                                           │
│                                                               │
│              ⟨ Dawn · Day · Dusk · Night ⟩   ← Time ribbon (F2B) │
│              "Did you know? …"  (existing fact)                │
└─────────────────────────────────────────────────────────────┘
```

Every addition slots into an **existing region** — no new screens, no layout
upheaval, and the map stays the hero. The two features are independent, so they
can ship in either order.

## Build plan (rough, ~2–3 hrs total)

| Order | Work | Est. |
|---|---|---|
| 1 | F2A Listen pill (xeno-canto + audio) | 20 min |
| 2 | F2B Time ribbon (activity model, fade, label) | 40 min |
| 3 | F1 Walk mode scaffold (mode, stops ordering, dotted loop, foot route) | 45 min |
| 4 | F1 narration: template composer + optional Claude call | 40 min |
| 5 | Polish, calm-tone pass, Playwright verification | 30 min |

## Risks & honest shortcuts
- **Browser-side Claude key** is a demo shortcut; template fallback guarantees a
  zero-config, always-working demo, and the production note (serverless proxy)
  is stated. No secret is committed — it's read from an untracked `.env.local`.
- **xeno-canto coverage** is bird-heavy; the Listen pill only appears when a
  recording exists, so gaps are invisible rather than broken.
- **Time Lens uses a curated activity model**, not live per-animal timestamps —
  more reliable and more teachable than sparse observation-hour data.
