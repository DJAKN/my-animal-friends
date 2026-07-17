# AI Nature Walk Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a one-click, 30–45 minute gentle circular walk that uses real pedestrian geometry when configured and a safe narrative-only fallback when external keys are unavailable.

**Architecture:** Shared pure functions validate candidates, build deterministic guide copy, and validate model selections. Framework-neutral server modules wrap OpenRouteService and the OpenAI Responses API; thin HTTP handlers expose `/api/walk`. The React client adds a Nearby CTA and reuses the existing map route and encounter list.

**Tech Stack:** React 19, Vite 8, Leaflet, Node.js Fetch API, OpenAI Responses API, OpenRouteService, Node built-in test runner.

## Global Constraints

- Never expose `OPENAI_API_KEY` or `OPENROUTESERVICE_API_KEY` to the browser bundle.
- OpenAI never generates geometry or unknown stop IDs.
- Without keys, return narrative-only template guidance and label routing unavailable.
- Exact coordinates are excluded from OpenAI payloads and logs.
- Preserve existing Nearby and Route behavior.

---

### Task 1: Walk domain and deterministic fallback

**Files:**
- Create: `app/src/walkGuide.js`
- Create: `app/src/walkGuide.test.js`

**Interfaces:**
- `buildWalkCandidates(animals, start, options) -> WalkCandidate[]`
- `buildFallbackGuide({ areaLabel, timeBucket, season, candidates }) -> WalkGuide`
- `validateGuideSelection(selection, allowedLoopIds, allowedStopIds) -> selection`

- [ ] Write failing tests proving candidate limits, diversity, narrative conditional language, no geometry in fallback, and rejection of unknown loop/stop IDs.
- [ ] Run `npm test -- src/walkGuide.test.js` and verify RED.
- [ ] Implement the smallest pure functions satisfying those tests.
- [ ] Run the focused test and verify GREEN.

### Task 2: Server-side walk orchestration

**Files:**
- Create: `app/server/walkService.js`
- Create: `app/server/walkService.test.js`
- Create: `app/api/walk.js`

**Interfaces:**
- `createWalk(request, { routeClient, narrativeClient }) -> WalkGuide`
- `createOpenRouteServiceClient({ apiKey, fetchImpl })`
- `createOpenAINarrativeClient({ apiKey, model, fetchImpl })`

- [ ] Write failing handler/service tests with injected clients for configured success, route failure, OpenAI failure, invalid model stop IDs, and missing-key fallback.
- [ ] Run `npm test -- server/walkService.test.js` and verify RED.
- [ ] Implement request validation, candidate-loop orchestration, schema-constrained OpenAI response parsing, and deterministic fallback.
- [ ] Add a thin serverless handler accepting only POST JSON and returning normalized errors.
- [ ] Run focused tests and verify GREEN.

### Task 3: Client walk experience

**Files:**
- Create: `app/src/walkApi.js`
- Create: `app/src/walkApi.test.js`
- Modify: `app/src/App.jsx`
- Modify: `app/src/index.css`

**Interfaces:**
- `requestWalk(payload, fetchImpl) -> WalkGuide`
- App state: `walk`, `walkBusy`, `walkError`.

- [ ] Write failing API tests for success, server failure, and local fallback.
- [ ] Run `npm test -- src/walkApi.test.js` and verify RED.
- [ ] Implement the API client and integrate **Create a gentle walk** into Nearby.
- [ ] Render walk summary, route geometry when present, stop list, narrative, routing-unavailable copy, and exit action.
- [ ] Run focused tests, lint, and build.

### Task 4: Local API runtime

**Files:**
- Create: `app/server/dev.js`
- Modify: `app/vite.config.js`
- Modify: `app/package.json`
- Modify: `README.md`

**Interfaces:**
- Local server listens on `127.0.0.1:8787` and exposes `/api/walk`.
- Vite proxies `/api` to the local server.

- [ ] Write a failing HTTP smoke test that posts a keyless request and expects a narrative-only fallback.
- [ ] Implement the minimal Node HTTP adapter and Vite proxy.
- [ ] Add `dev:api` and document environment variables and two-process local startup.
- [ ] Verify the smoke test, full tests, lint, and build.
