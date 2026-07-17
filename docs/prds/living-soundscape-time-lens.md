# Living Soundscape and Time Lens PRD

## Summary

Living Soundscape gives bird detail cards a manually played real recording. Time Lens explains when animals are typically active and changes visual emphasis without pretending to predict real-time presence.

## Priority

P1 supporting feature. It enhances the AI walk but does not compete with it for demo time.

## User Stories

- As a visitor viewing a bird, I can play one attributed recording and feel a stronger connection to the species.
- As a visitor, I can choose Dawn, Day, Dusk, or Night and see animals commonly active at that time emphasized on the map.
- As a walk user, the selected time bucket influences guide copy and candidate relevance.

## Soundscape Requirements

- Audio is guaranteed only for birds in the first release.
- Search uses scientific name and returns one preferred recording.
- Prefer recordings with clear attribution, an explicit reuse license, and higher source quality.
- Playback is always initiated by the user and stops when the card closes or another recording starts.
- Display recordist, source, license, and an external source link.
- Missing or failed audio quietly removes the player without affecting the detail card.
- Xeno-canto credentials stay in the serverless environment.

## Time Lens Requirements

- Four choices: Dawn, Day, Dusk, and Night.
- Activity values are `diurnal`, `nocturnal`, `crepuscular`, or `variable`.
- The first release uses a small, reviewable static mapping by iconic taxon plus curated overrides for demo species.
- Time Lens changes marker emphasis and ordering; it never completely hides observations.
- Unknown species display: **Activity varies by place and season.**
- The current season appears as explanatory copy only; there is no second interactive slider.

## Non-Goals

- Audio for every animal group, automatic playback, sound recognition, ambient mixing, ecological forecasting, or a complete global activity database.

## Success Criteria

- A supported bird plays only after a user action and shows complete attribution.
- Time Lens visibly changes emphasis while preserving all observations.
- Failure of the sound service or missing activity metadata never blocks Nearby, details, or AI Walk.

## Dependencies

- Existing taxon metadata and detail card.
- A serverless bird-sound proxy and a verified xeno-canto API v3 integration.
- Shared `timeBucket` state with Nearby and AI Walk.
