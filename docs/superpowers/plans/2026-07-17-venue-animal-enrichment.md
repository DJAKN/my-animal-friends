# Venue Animal Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate sourced, confidence-labelled animal lists for zoo and aquarium detail cards without runtime scraping or a backend.

**Architecture:** A build-time script resolves official venue pages, performs a bounded same-origin crawl, extracts animal-name candidates from semi-structured HTML, validates candidates through cached taxonomy lookups, and writes one static JSON artifact per OSM venue. The React detail card lazily loads the artifact.

**Tech Stack:** Node.js, Fetch API, Cheerio, robots.txt parsing, iNaturalist/Wikidata APIs, static JSON, React.

## Global Constraints

- Official venue pages are primary; Wikipedia/Wikidata are supplemental.
- Respect robots.txt, ten-page maximum, 10-second request timeout, 2 MB body limit, and concurrency of two.
- Every animal entry retains a source URL, confidence, and generation timestamp.
- Runtime remains static and keyless.

---

### Task 1: Define and validate the artifact schema

**Files:**
- Create: `app/src/venueAnimals.js`
- Create: `app/src/venueAnimals.test.js`

**Interfaces:**
- Produces: `venueAnimalUrl(place) -> string` using `<osmType>-<osmId>`.
- Produces: `validateVenueAnimalArtifact(value) -> VenueAnimalArtifact`.
- Artifact animals contain `displayName`, optional `scientificName`, optional `taxonId`, `sourceUrl`, and `confidence`.

- [ ] Write failing schema tests for verified, official-unresolved, supplemental, invalid confidence, and missing provenance.
- [ ] Run `npm test -- src/venueAnimals.test.js` and verify RED.
- [ ] Implement strict validation and artifact URL generation.
- [ ] Run the focused test and verify GREEN.

### Task 2: Build the bounded official-site crawler

**Files:**
- Create: `app/scripts/enrich-venue-animals.mjs`
- Create: `app/scripts/lib/venue-crawler.mjs`
- Create: `app/scripts/lib/venue-crawler.test.mjs`
- Modify: `app/package.json`

**Interfaces:**
- Produces: `crawlVenue({ website, maxPages: 10, timeoutMs: 10000, maxBytes: 2097152 }) -> Page[]`.
- Each Page contains `{ url, html, fetchedAt }`.

- [ ] Add Cheerio and a robots.txt parser, plus an `enrich:venues` script.
- [ ] Write fixture-based failing tests for same-origin filtering, relevant-link selection, robots denial, page cap, timeout, and body cap.
- [ ] Run the crawler tests and verify RED.
- [ ] Implement breadth-first crawling limited to links containing animal/species/exhibit or `生き物`/`展示`/`動物`/`魚`.
- [ ] Run the focused tests and verify GREEN.

### Task 3: Extract and validate taxonomy candidates

**Files:**
- Create: `app/scripts/lib/animal-extractor.mjs`
- Create: `app/scripts/lib/animal-extractor.test.mjs`

**Interfaces:**
- Produces: `extractCandidates(page) -> Candidate[]` from tables, lists, headings, image alt text, and JSON-LD.
- Produces: `resolveCandidates(candidates, taxonomyClient) -> AnimalEntry[]`.

- [ ] Write fixture-based failing tests using representative English and Japanese aquarium HTML.
- [ ] Verify exhibit names such as `Penguin Village` are rejected unless a taxonomy match exists.
- [ ] Implement candidate extraction, normalized deduplication, cached iNaturalist lookup, and confidence assignment.
- [ ] Run the focused tests and verify GREEN.

### Task 4: Generate and consume static artifacts

**Files:**
- Modify: `app/scripts/enrich-venue-animals.mjs`
- Create: `app/public/venue-animals/way-221599485.json`
- Modify: `app/src/DetailCard.jsx`
- Modify: `app/src/venueAnimals.test.js`

**Interfaces:**
- Consumes the crawler and extractor.
- Produces files at `app/public/venue-animals/<osmType>-<osmId>.json`.

- [ ] Write a failing UI/data-loader test for lazy loading, missing artifacts, source links, and generated date.
- [ ] Generate the Kaikyokan artifact from official pages and inspect every extracted entry.
- [ ] Add lazy loading to aquarium/zoo detail cards and label the data `Venue website, captured <date>`.
- [ ] Run all tests, lint, build, and a local detail-card verification.
