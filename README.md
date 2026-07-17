# My Animal Friends 🦝

Explore the world you share with animals — around you, or along your way.

A calm map webapp that shows real wild animal sightings (iNaturalist) and
animal places like zoos, aquariums and animal cafes (OpenStreetMap) around
your location, or along a road trip between any two places. Tap any animal
to learn its story, its conservation status, and how to live kindly
alongside it.

Nearby observations can also become a calm circular nature walk. A Time
Lens explains typical activity at dawn, day, dusk, and night, while supported
bird cards offer a manually played, attributed field recording.

Built as a 2-hour hackathon project. See [PRD.md](PRD.md) for the full
product spec.

## Run the demo

```bash
cd app
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:5173, allow location access (or search any place),
and say hello to the neighbors.

- **Nearby** — wild animals appear as soft "distribution clouds" showing
  where each species is generally found; zoos, aquariums, animal cafes and
  farms are precise icon pins. Toggle layers top-right.
- **Route** — enter a start and destination (e.g. Shibuya → Roppongi) to see
  who lives along the road.
- **Gentle walk** — create a 30–45 minute pedestrian loop through three to
  five nearby animal observations, with calm OpenAI-generated field guidance.
- **Time Lens and soundscape** — shift activity emphasis by time of day and
  listen to attributed xeno-canto recordings on supported bird cards.

Core discovery data comes from iNaturalist, OpenStreetMap Overpass, OSRM,
Nominatim, and Wikipedia. The optional nature-walk and soundscape features use
same-origin server endpoints so credentials never enter the browser.

## Optional feature configuration

Set these values in `app/.env.local` for local development, and as server-side
environment variables in deployment:

- `OPENAI_API_KEY` and optional `OPENAI_MODEL` for structured walk narration.
- `OPENROUTESERVICE_API_KEY` for real `foot-walking` loop geometry.
- `XENO_CANTO_API_KEY` for bird recordings.

Without these keys, the app remains usable: Gentle Walk produces a clearly
labelled observation preview, and bird cards omit the audio player. The local
development command starts both Vite and the small API server. Deployments that
support Node serverless functions can use the handlers in `app/api/`.

## Fast, offline-safe demo

The presentation scenarios (`Shibuya`, `Shimonoseki`, and the
`Shibuya → Roppongi` route) are optimized to load instantly:

- Their coordinates are built in, so searches skip the geocoding round-trip.
- On startup the app quietly pre-warms these scenarios into its cache.
- For a fully offline-safe demo, capture real data once into local snapshots:

```bash
cd app && npm run capture   # needs internet; writes app/public/demo/*.json
```

After capturing, those three scenarios load from local files — no network
needed, so the demo survives flaky venue wifi. Any other search still uses
the live APIs.
