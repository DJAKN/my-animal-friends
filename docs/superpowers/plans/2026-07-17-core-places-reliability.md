# Core Places Reliability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make aquarium, zoo, bird-hide, farm, and petting/boarding discovery survive an unavailable Overpass endpoint without being blocked by the animal-café query.

**Architecture:** Move Overpass transport into a small dependency-injected module that validates payloads and performs sequential endpoint failover with a per-attempt timeout. Keep response mapping in `api.js`, but expose the core query builder and mapper for deterministic regression tests.

**Tech Stack:** JavaScript ES modules, browser Fetch API, AbortController, Node.js built-in test runner, Vite, React.

## Global Constraints

- Runtime remains pure frontend with no backend, API key, or secret.
- Public-facing code, tests, documentation, and commit metadata remain English.
- Preserve all unrelated uncommitted workspace changes.
- Do not include the expensive animal-café name regular expression in the core query.

---

### Task 1: Add the Overpass failover client

**Files:**
- Create: `app/src/overpass.js`
- Create: `app/src/overpass.test.js`
- Modify: `app/package.json`

**Interfaces:**
- Produces: `fetchOverpass(query, options) -> Promise<{elements: Array}>`
- Produces: `OverpassRequestError` with a `failures` array.
- Options: `{ fetchImpl, endpoints, timeoutMs }`, all optional in production.

- [ ] **Step 1: Add the test command and failing transport tests**

Add `"test": "node --test"` to `scripts` and create tests covering 406 failover, abort timeout, malformed payload failover, and aggregate failure.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/overpass.test.js`

Expected: FAIL because `./overpass.js` does not exist.

- [ ] **Step 3: Implement the minimal client**

Implement three default endpoints, a 10,000 ms timeout, POST form encoding, validation that `elements` is an array, and sequential failover. Clear every timeout in `finally` and retain `{ endpoint, message }` for each failed attempt.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/overpass.test.js`

Expected: all Overpass transport tests pass.

### Task 2: Integrate the core Places query

**Files:**
- Modify: `app/src/api.js`
- Create: `app/src/api.test.js`

**Interfaces:**
- Consumes: `fetchOverpass(query)` from Task 1.
- Produces: `buildCorePlaceFilters(around) -> string`.
- Produces: `mapOverpassElements(data) -> Place[]`.

- [ ] **Step 1: Write failing regression tests**

Test that the core query contains `tourism` aquarium/zoo, bird hides, named farmyards, and petting/boarding selectors but not `amenity=cafe`. Test that an OSM fixture for way `221599485` maps to an `aquarium` Place named `下関市立しものせき水族館・海響館`.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test -- src/api.test.js`

Expected: FAIL because the query builder and mapper are not exported and the query still contains the café selector.

- [ ] **Step 3: Implement the minimal integration**

Import `fetchOverpass`, rename and export the core filter builder, remove the café selector from it, call `fetchOverpass(query)`, and export the existing mapping function without changing its output contract.

- [ ] **Step 4: Run tests and verify GREEN**

Run: `npm test -- src/api.test.js src/overpass.test.js`

Expected: all focused tests pass.

### Task 3: Verify the complete repair

**Files:**
- Verify only: `app/src/overpass.js`, `app/src/api.js`, tests, `app/package.json`

**Interfaces:**
- Consumes the completed Tasks 1–2.
- Produces no new API.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: zero failures.

- [ ] **Step 2: Run static checks and the production build**

Run: `npm run lint && npm run build`

Expected: exit code 0 with no lint errors and a successful Vite bundle.

- [ ] **Step 3: Run a live Shimonoseki query**

Invoke `fetchAnimalPlaces(33.9578, 130.9410)` from Node and assert that the returned names contain `下関市立しものせき水族館・海響館`.

Expected: the primary endpoint may fail, but a later endpoint returns the aquarium.

- [ ] **Step 4: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; unrelated pre-existing changes remain unstaged and unmodified.
