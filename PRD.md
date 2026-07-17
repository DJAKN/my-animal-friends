# My Animal Friends — Product Requirements Document

> Hackathon project · Target build time: ~2 hours · Demo-first, engineering-perfection-later

## 1. Vision

**Let people explore the world they share with animals.**

My Animal Friends is a calm, beautiful web app that shows you the animals around you — whether you're standing still or planning a journey. By making the invisible animal world visible on a familiar map, it nurtures curiosity, empathy, and ultimately a mindset of environmental protection and harmonious coexistence between humans and animals.

The tone is *peaceful*: no gamification pressure, no notifications, no social feeds. Just you, a map, and the creatures that live alongside us.

## 2. Target Users

- Curious locals who want to discover wildlife in their own neighborhood
- Travelers planning a trip who want animal encounters along the way
- Parents / educators looking for a gentle nature-learning tool
- Anyone needing a relaxing "digital nature walk"

## 3. Core User Stories

1. **Nearby mode** — "As a user, I allow the app to read my location, and I see a map of animals around me: wild sightings (e.g., raccoon dogs in the Japanese countryside) and animal places (zoos, aquariums, dog cafes)."
2. **Route mode** — "As a user, I pick a start and a destination; the app draws a road route and shows me the animals I could encounter along that corridor."
3. **Learn** — "As a user, I tap any animal and see its photo, name, a short description, its conservation status, and a coexistence tip — so I leave knowing something new."

## 4. Features & Scope

### 4.1 Nearby Mode (P0)
- Request browser geolocation; graceful fallback to a scenic default location (with a manual "search a place" box) if denied.
- Full-screen map centered on the user.
- Two data layers, visually distinct:
  - **Wild sightings** — recent animal observations from iNaturalist within a radius (~10 km), shown as soft circular photo markers.
  - **Animal places** — zoos, aquariums, wildlife parks, animal cafes, farms from OpenStreetMap, shown as icon markers.
- Layer toggles (Wild / Places) in a floating control.

### 4.2 Route Mode (P0)
- Two inputs: origin and destination (free-text, geocoded via Nominatim).
- Road route computed via the public OSRM demo server and drawn on the map.
- The route is sampled at intervals; animals and animal places are fetched around each sample point and displayed along the corridor.
- A scrollable side panel lists the animal encounters in route order, like a gentle itinerary.

### 4.3 Animal Detail Card (P0)
- Clicking a marker opens a soft card: photo, common + scientific name, short description (Wikipedia summary API), conservation status badge when available (from iNaturalist taxon data).
- A one-line **coexistence tip** (curated static copy per animal group, e.g., "Observe from a distance — never feed wild raccoons").

### 4.4 Peaceful Learning Touches (P1, if time allows)
- A rotating "Did you know?" nature fact in the header or an ambient footer line.
- Gentle marker entrance animations; soft map style.

### Non-Goals (explicitly cut for the hackathon)
- No backend, no database, no user accounts, no API keys/secrets.
- No offline support, no i18n (English UI only), no mobile-native builds (responsive web is enough).
- No real-time tracking, no user-submitted sightings.
- Rate limits / occasional API hiccups are acceptable; errors fail soft with a friendly message.

## 5. Data Sources (all free, no key required)

| Need | Source | API |
|---|---|---|
| Wild animal sightings w/ photos & taxa | iNaturalist | `GET api.inaturalist.org/v1/observations` (lat/lng/radius, `photos=true`, `iconic_taxa` filter to animals) |
| Zoos, aquariums, animal cafes, farms | OpenStreetMap | Overpass API (`tourism=zoo|aquarium`, `amenity=cafe`+`cuisine/theme` animal tags, `landuse=farmyard` etc.) |
| Road routing A→B | OSRM demo server | `GET router.project-osrm.org/route/v1/driving/...` |
| Place name → coordinates | Nominatim | `GET nominatim.openstreetmap.org/search` |
| Animal descriptions | Wikipedia | `GET en.wikipedia.org/api/rest_v1/page/summary/{title}` |
| Map tiles | OpenStreetMap / CARTO light tiles | Leaflet tile layer |

## 6. UX & Visual Direction

- **Mood**: a quiet morning walk in nature. Calm, professional, unhurried.
- **Palette**: sage green, warm cream, soft earth tones; muted map tiles (CARTO Positron or similar light style).
- **Type**: one friendly rounded display face for headings, clean sans for body.
- **Motion**: slow fades and gentle scale-ins only; nothing bounces or blinks.
- **Copy voice**: warm and respectful of animals ("Neighbors nearby", "Along your way, you may meet…").
- **Layout**: full-bleed map; floating glassmorphic panels (mode switcher top, detail card / route itinerary side panel); fully responsive.

### Map presence language (informed by prototype review)
- Wild sightings appear as **soft halo photo markers** — a circular thumbnail with a
  translucent glow suggesting an area of presence, never a sharp pin. This keeps the
  map calm and honest (observation coords are approximate anyway).
- Animal places use small distinct **icon badges** so the two layers read apart at a glance.
- Route mode surfaces a **calm ambient banner** ("Along your way, you may meet 12 wild
  neighbors"), never alarm-styled warnings — no red/orange alert visual language anywhere.
- Detail opens as a light side card / bottom sheet that never covers the whole map.
- Explicitly rejected from the reference prototype: speed-based mode switching, rescue
  reporting, voice/camera capture, user accounts, and alert-red visual language.

## 7. Technical Approach

- **Stack**: Vite + React + Leaflet (react-leaflet) + Tailwind CSS. Single-page app, pure frontend.
- **Deploy/demo**: `npm run dev` locally is sufficient for the demo; optionally GitHub Pages static build.
- **State**: plain React state; no state library.
- **All API calls client-side** with simple `fetch`, small in-memory caching, and per-call error tolerance (a failed layer never blocks the map).

## 8. Build Plan (~2 hours)

| Time | Milestone |
|---|---|
| 0:00–0:15 | Scaffold Vite+React+Tailwind+Leaflet; map renders with calm tile style |
| 0:15–0:45 | Nearby mode: geolocation + iNaturalist layer + Overpass places layer |
| 0:45–1:15 | Animal detail card: photos, Wikipedia summary, conservation badge, coexistence tips |
| 1:15–1:45 | Route mode: geocoding, OSRM route, corridor sampling, itinerary panel |
| 1:45–2:00 | Visual polish, empty/error states, demo walkthrough |

## 9. Demo Success Criteria

1. Open the app → allow location → within seconds, see real animals and animal places around you on a beautiful, calm map.
2. Tap an animal → learn its name, story, and how to coexist with it.
3. Enter "Tokyo → Nikko" (or any A→B) → see the road route and animal encounters along it.
4. The experience feels peaceful and professional — a viewer should *feel* the message of sharing the world with animals.
