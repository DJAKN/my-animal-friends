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

- **Nearby** — wild sightings glow softly on the map; animal places wear
  little badges. Toggle layers top-right.
- **Route** — enter a start and destination (e.g. Tokyo → Nikko) to see
  who lives along the road.

All data comes from free public APIs (iNaturalist, OpenStreetMap Overpass,
OSRM, Nominatim, Wikipedia) — no keys, no backend, everything runs in the
browser.
