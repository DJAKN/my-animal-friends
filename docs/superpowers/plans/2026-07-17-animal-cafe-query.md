# Animal Café Query Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore animal cafés as an independently degradable Places source without the expensive case-insensitive Overpass name regular expression.

**Architecture:** Fetch bounded named café and structured `animal=*` candidates through the shared failover client, then apply Unicode-normalized English and Japanese keyword matching in the browser. Merge and deduplicate café results after core Places have loaded.

**Tech Stack:** JavaScript ES modules, Overpass API, Node.js built-in test runner, React.

## Global Constraints

- A café failure must never remove or delay core Places.
- Keep the runtime frontend-only and keyless.
- Preserve source OSM IDs for deterministic deduplication.

---

### Task 1: Add deterministic café candidate filtering

**Files:**
- Create: `app/src/animalCafes.js`
- Create: `app/src/animalCafes.test.js`

**Interfaces:**
- Produces: `buildAnimalCafeFilters(around) -> string` using exact indexed selectors only.
- Produces: `isAnimalCafe(tags) -> boolean`.
- Produces: `filterAnimalCafeElements(elements) -> Element[]`.

- [ ] Write failing tests for English and Japanese keywords, `animal=*`, Unicode case normalization, false positives, and OSM ID deduplication.
- [ ] Run `npm test -- src/animalCafes.test.js` and verify failures are caused by the missing module.
- [ ] Implement `buildAnimalCafeFilters` with `nwr["amenity"="cafe"]["name"]` and `nwr["amenity"="cafe"]["animal"]`; implement local matching for `cat`, `dog`, `owl`, `rabbit`, `hedgehog`, `bird`, `animal`, `猫`, `犬`, `ふくろう`, `フクロウ`, `うさぎ`, `ウサギ`, `ハリネズミ`, and `動物`.
- [ ] Run the focused test and verify all cases pass.

### Task 2: Load cafés independently

**Files:**
- Modify: `app/src/api.js`
- Modify: `app/src/App.jsx`
- Modify: `app/src/api.test.js`

**Interfaces:**
- Consumes: `fetchOverpass`, `buildAnimalCafeFilters`, and `filterAnimalCafeElements`.
- Produces: `fetchAnimalCafes(lat, lng, radiusM) -> Promise<Place[]>`.
- Produces: a nearby result state containing `places`, `cafes`, and `cafeError`.

- [ ] Write a failing test proving a rejected café request still returns core aquarium results.
- [ ] Run the focused test and verify RED.
- [ ] Fetch core Places and cafés independently with `Promise.allSettled`, merge successful results by `id`, and expose a café-specific partial failure.
- [ ] Render `Core places loaded; animal cafés are temporarily unavailable.` without changing the Wild status.
- [ ] Run focused tests and verify GREEN.

### Task 3: Benchmark and release gate

**Files:**
- Create: `app/scripts/benchmark-animal-cafes.mjs`
- Modify: `README.md`

**Interfaces:**
- Produces benchmark rows `{ place, durationMs, bytes, candidateCount, matchedCount }` for Shimonoseki, Shibuya, and central London.

- [ ] Implement a sequential benchmark using the shared query shape and a 20-second per-location ceiling.
- [ ] Run the benchmark and record results in README.
- [ ] If any response exceeds 1 MB or 10 seconds on the first successful endpoint, reduce only the café radius to 6 km and rerun.
- [ ] Run `npm test && npm run lint && npm run build` and require zero failures.
