# AI Nature Walk Guide PRD

## Summary

AI Nature Walk Guide turns nearby animal observations into a calm 30–45 minute circular walk. The routing system guarantees real pedestrian geometry; OpenAI chooses the most coherent candidate loop and writes a short, respectful narrative for each stop.

## Priority

P0 hero feature for the hackathon demo.

## User Story

As a visitor, I can start from my current position or the Shibuya demo location, tap **Create a gentle walk**, and receive a 1.5–3 km loop containing three to five real nearby animal stops, gentle field guidance, distance, and estimated duration.

## Product Requirements

- Entry lives in Nearby mode rather than adding a third top-level mode.
- A generated walk starts and ends at the same location.
- Every stop references an animal already present in the current nearby dataset.
- Pedestrian geometry and distance come from a routing service, never from the language model.
- OpenAI selects only from validated candidate-loop IDs and returns structured narration.
- Each stop contains a title, 40–70 words of narration, and one coexistence reminder.
- The guide includes a short opening, closing, distance, and duration.
- Exact coordinates are not sent to OpenAI. The model receives relative segment distances, coarse area context, time bucket, season, and animal facts.

## Failure and Offline Behavior

- When OpenAI is unavailable, select the shortest valid loop and generate template narration.
- When pedestrian routing is unavailable, do not draw straight lines as a walkable route. Present a narrative-only preview with a clear routing-unavailable message.
- When fewer than three suitable animals exist, create a two-stop mini walk or suggest another nearby park.
- Ship a Shibuya demo snapshot for a reliable presentation path.

## Non-Goals

- Turn-by-turn navigation, background GPS tracking, route history, user accounts, and guaranteed sightings.
- AI-generated coordinates, road-safety claims, or real-time animal-presence predictions.

## Success Criteria

- One click produces a complete guide in under 30 seconds, targeting 10–15 seconds.
- All stop IDs are valid, the route is a pedestrian loop, and the narrative never claims a guaranteed sighting.
- The demo clearly communicates that scattered observations have become a calm, meaningful journey.

## Dependencies

- Existing Nearby animal data and Leaflet map.
- A serverless endpoint with `OPENAI_API_KEY` and `OPENROUTESERVICE_API_KEY`.
- OpenAI Responses API structured output and OpenRouteService foot-walking directions.
