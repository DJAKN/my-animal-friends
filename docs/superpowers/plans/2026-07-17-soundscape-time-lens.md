# Living Soundscape and Time Lens Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four time-of-day lenses and manually played, attributed bird recordings without blocking existing animal discovery.

**Architecture:** A pure activity module supplies profiles, copy, and marker emphasis. Time Lens state lives in App and flows into MapView and walk requests. A framework-neutral server proxy normalizes one licensed xeno-canto recording; DetailCard loads it only for birds and renders a manual audio element.

**Tech Stack:** React 19, Leaflet, Node.js Fetch API, xeno-canto API v3, Node built-in test runner.

## Global Constraints

- Audio is bird-only in the first release and never autoplays.
- Display recordist, source URL, and license for every recording.
- Missing sound and activity metadata fail softly.
- Time Lens changes emphasis but never hides observations.
- Keep `XENO_CANTO_API_KEY` server-side.

---

### Task 1: Activity model

**Files:**
- Create: `app/src/activity.js`
- Create: `app/src/activity.test.js`

**Interfaces:**
- `TIME_BUCKETS = ['dawn', 'day', 'dusk', 'night']`
- `getActivityProfile(animal) -> ActivityProfile`
- `activityEmphasis(profile, timeBucket) -> number`
- `activityCopy(profile, timeBucket, season) -> string`

- [ ] Write failing tests for diurnal, nocturnal, crepuscular, variable, demo-species overrides, and emphasis always remaining above zero.
- [ ] Run the focused test and verify RED.
- [ ] Implement curated overrides plus iconic-taxon defaults and explanatory copy.
- [ ] Run the focused test and verify GREEN.

### Task 2: Time Lens UI and map integration

**Files:**
- Modify: `app/src/App.jsx`
- Modify: `app/src/MapView.jsx`
- Modify: `app/src/index.css`

**Interfaces:**
- App state: `timeBucket` defaults from local hour.
- MapView prop: `timeBucket`.

- [ ] Add a failing pure rendering-data test proving inactive markers remain visible with lower emphasis.
- [ ] Add the four-choice Time Lens control to Nearby and pass the selection to MapView and walk payloads.
- [ ] Apply emphasis to range/marker opacity and add current-season explanatory copy.
- [ ] Run tests, lint, and build.

### Task 3: Bird sound proxy

**Files:**
- Create: `app/server/birdSoundService.js`
- Create: `app/server/birdSoundService.test.js`
- Create: `app/api/bird-sounds.js`
- Modify: `app/server/dev.js`

**Interfaces:**
- `findBirdSound(scientificName, { apiKey, fetchImpl }) -> BirdSound | null`
- BirdSound: `{ audioUrl, recordist, license, sourceUrl, type }`.

- [ ] Write failing tests for scientific-name validation, quality ordering, license requirement, normalized attribution, missing key, and empty results.
- [ ] Implement the xeno-canto v3 proxy and thin GET handler.
- [ ] Extend the local server route and run focused tests.

### Task 4: Detail-card audio and activity

**Files:**
- Create: `app/src/birdSounds.js`
- Create: `app/src/birdSounds.test.js`
- Modify: `app/src/DetailCard.jsx`
- Modify: `app/src/index.css`

**Interfaces:**
- `loadBirdSound(scientificName, fetchImpl) -> BirdSound | null`.
- DetailCard props add `timeBucket` and `season`.

- [ ] Write failing client tests for bird-only requests, normalized null failures, and no autoplay field.
- [ ] Add activity copy to every wild detail and a manual `<audio controls preload="none">` block for supported birds.
- [ ] Stop audio by unmounting when selection changes or closes.
- [ ] Run focused tests, full tests, lint, build, and browser verification.
