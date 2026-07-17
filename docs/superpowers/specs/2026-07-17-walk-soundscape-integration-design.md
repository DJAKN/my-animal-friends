# Nature Walk and Soundscape Integration Design

## Architecture

The two features share an `EncounterContext` but remain independently degradable:

```text
EncounterContext
  areaLabel
  coarseLocation
  timeBucket
  season
  candidateAnimals[]
  candidatePlaces[]
```

Each candidate animal carries `id`, `taxonId`, common and scientific names, iconic taxon, coordinates, activity profile, observation source, and optional photo.

Nearby owns the selected time bucket. Time Lens uses it for map emphasis, and AI Walk includes it in route scoring and narration. Bird audio is loaded only when a detail card opens.

## AI Walk Data Flow

1. Nearby submits the start position and a bounded candidate list to `/api/walk`.
2. The server validates input and asks the pedestrian service for reachable candidate loops.
3. The server sends only loop IDs, relative distances, coarse area, time context, and animal facts to OpenAI.
4. OpenAI returns a schema-constrained loop choice and narration.
5. The server rejects unknown loop or stop IDs and returns validated route GeoJSON and guide content.
6. If OpenAI fails, the server returns the shortest valid loop with deterministic template copy.
7. If routing is unavailable, the client produces a narrative-only fallback and labels routing as unavailable.

The model never produces route geometry or new animal facts.

## Sound Data Flow

1. A bird detail card requests `/api/bird-sounds?scientificName=...`.
2. The server validates the name, queries xeno-canto, filters for attributable licensed recordings, and returns one normalized result.
3. The client renders a manual audio control and attribution.
4. Errors and empty results render no player.

## Runtime and Deployment

- Vite remains the frontend build.
- Server logic is framework-neutral Node code exposed through thin serverless handlers.
- A local development server provides the same `/api` contract.
- Secrets are `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENROUTESERVICE_API_KEY`, and `XENO_CANTO_API_KEY`.
- No secret is emitted into Vite environment variables, client bundles, logs, or API responses.
- Requests use validation, timeouts, and small in-memory caches. No database or account system is introduced.

## UI Integration

- Nearby gains a **Create a gentle walk** button and a compact Time Lens control.
- Walk results reuse the existing route polyline and encounter-list visual language, with a distinct calm guide heading.
- Detail cards gain activity copy for every animal and optional audio for birds.
- Route mode remains unchanged and continues to represent origin-to-destination travel.

## Testing

- Unit tests cover activity profiles, time emphasis, deterministic walk fallback, input validation, response-schema validation, unknown stop rejection, sound normalization, attribution, and no-autoplay behavior.
- Handler tests inject fake OpenAI, routing, and sound clients.
- Integration tests verify that absent keys trigger safe fallbacks rather than exposing secrets or crashing.
- Browser verification covers Nearby → Time Lens → Generate Walk → Select Stop → Play Bird Sound.

## Privacy and Safety

- Exact coordinates may be used by the routing service but are reduced to coarse area context before OpenAI input.
- Precise location is not retained or logged.
- Copy uses conditional language such as “you may notice” and never guarantees an encounter.
- A generated walk is presented as a suggested route, not certified safety guidance.
