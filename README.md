# My Animal Friends 🦝

Explore the world you share with animals — around you, or along your way.

A calm map webapp that shows real wild animal sightings (iNaturalist) and
animal places like zoos, aquariums and animal cafes (OpenStreetMap) around
your location, or along a road trip between any two places. Tap any animal
to learn its story, its conservation status, and how to live kindly
alongside it.

Built as a 2-hour hackathon project. See [PRD.md](PRD.md) for the full
product spec.

## Run the demo

```bash
cd app
npm install
npm run dev
```

Open http://localhost:5173, allow location access (or search any place),
and say hello to the neighbors.

- **Nearby** — wild animals appear as soft "distribution clouds" showing
  where each species is generally found; zoos, aquariums, animal cafes and
  farms are precise icon pins. Toggle layers top-right.
- **Route** — enter a start and destination (e.g. Shibuya → Roppongi) to see
  who lives along the road.

All data comes from free public APIs (iNaturalist, OpenStreetMap Overpass,
OSRM, Nominatim, Wikipedia) — no keys, no backend, everything runs in the
browser.

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
