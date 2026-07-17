# Places Reliability and Venue Animals Design

## Objective

Restore reliable discovery of core animal places in the browser-only application, preserve animal cafés through a separately degradable query, and define an efficient build-time pipeline for enriching zoos and aquariums with sourced animal lists.

The application must remain a pure frontend with no runtime backend, API key, or secret.

## Current Failure

The Places layer sends one combined Overpass query to a single public endpoint. The configured endpoint currently returns HTTP 406, while the case-insensitive animal-café name regular expression causes the combined query to time out on an otherwise working mirror. The caller converts every Places exception to an empty array, so an unavailable data source is presented as a legitimate zero-result search.

The Shimonoseki aquarium is correctly mapped in OpenStreetMap as way `221599485` with `tourism=aquarium`. A narrow query returns it successfully, so neither geocoding, search radius, OSM coverage, nor response mapping is the root defect.

## Runtime Architecture

Create a focused Overpass client responsible for endpoint failover and response validation. It will attempt these public endpoints sequentially:

1. `https://maps.mail.ru/osm/tools/overpass/api/interpreter`
2. `https://overpass-api.de/api/interpreter`
3. `https://overpass.private.coffee/api/interpreter`

Production ordering starts with the Mail.ru instance, followed by the main instance and Private.coffee, because live verification showed that ordering returns the Shimonoseki aquarium reliably. Each attempt has a 15-second `AbortController` timeout. HTTP failures, timeouts, malformed JSON, and invalid Overpass payloads advance to the next endpoint. The first valid payload wins. If every endpoint fails, the client throws a structured error that retains per-endpoint failure details.

The immediate defect fix will use this client for a core Places query that includes aquariums, zoos, named farmyards, and petting or boarding facilities. The known-expensive animal-café name expression and slow bird-hide selector will not remain in this core query. This guarantees that an optional-place timeout cannot suppress a valid aquarium. Bird hides will move to the same independently degradable follow-up path as animal cafés.

The UI data contract must distinguish a successful empty result from an unavailable Places layer. Error presentation can be added without blocking Wild results, preserving the existing fail-soft experience.

## Animal Café Query Plan

Animal cafés remain in product scope but move into an independent, degradable query. The Overpass query should request bounded structured candidates without applying a case-insensitive name regular expression on the server:

```overpass
nwr["amenity"="cafe"]["name"](around:...);
nwr["amenity"="cafe"]["animal"](around:...);
```

The browser will filter candidates using normalized Unicode text and structured tags. The initial vocabulary includes English and Japanese terms for cats, dogs, owls, rabbits, hedgehogs, birds, and animals. Candidate results are deduplicated by OSM element type and ID.

The café request runs independently from core Places. Its timeout or endpoint failure produces a partial-data state rather than removing aquariums and zoos. Before release, benchmark response time and payload size in low- and high-density cities. If the payload is too large, reduce only the café radius or partition its spatial query; do not remove the feature.

## Venue Animal Enrichment Plan

Zoo and aquarium animal lists will be generated at build or demo-capture time, not scraped in users' browsers. This avoids arbitrary-site CORS restrictions while preserving a static, backend-free runtime.

For each OSM zoo or aquarium:

1. Read `website`, `wikidata`, and `wikipedia` tags.
2. If the official site is missing, resolve Wikidata's official website property.
3. Crawl at most ten same-origin pages whose URL or link text indicates animal, species, exhibit, `生き物`, `展示`, `動物`, or `魚` content.
4. Respect `robots.txt`, enforce request timeouts and body-size limits, and use low concurrency.
5. Extract candidates primarily from tables, lists, headings, image alternative text, and JSON-LD.
6. Validate candidates against iNaturalist or Wikidata taxonomy data.
7. Deduplicate validated taxa and emit a static JSON artifact keyed by OSM element type and ID.

Each animal entry contains a display name, optional scientific name and taxon ID, source URL, confidence, and extraction timestamp. Confidence values are:

- `verified`: explicitly named by an official venue source and matched to taxonomy data.
- `official-unresolved`: explicitly named by an official venue source but not resolved to a species.
- `supplemental`: available only from Wikipedia or Wikidata.

The frontend lazily loads this artifact when a zoo or aquarium detail card opens. It displays source attribution and generation date and never describes the list as real-time inventory.

## Testing Strategy

Use Node's built-in test runner to avoid adding a test framework solely for this repair.

Regression coverage must prove:

- A 406 response from the first endpoint advances to a successful second endpoint.
- A timed-out endpoint advances to the next endpoint using the 15-second production budget.
- Malformed payloads do not terminate failover.
- Exhausting every endpoint throws the structured aggregate error.
- The Shimonoseki Overpass fixture maps way `221599485` to an aquarium Place.
- The core Places query excludes the expensive café name expression and slow bird-hide selector.

Run the focused tests first, followed by the complete test command, lint, and production build.

## Delivery Boundaries

The immediate code change implements endpoint failover, timeouts, payload validation, the core Places query, and regression tests. The animal-café independent query and venue-animal enrichment pipeline are separate implementation tasks documented in the follow-up plan. Existing uncommitted demo scenario and snapshot changes must remain untouched.
