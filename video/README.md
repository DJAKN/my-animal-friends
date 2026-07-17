# My Animal Friends — Pitch video

A [Remotion](https://remotion.dev) project that composes the pitch video from
the **real app components** (imported from `../app/src`), so what you see in the
video is the actual product UI — not a mockup or an AI-generated impression.

## What's here

- `src/scenes/Opening.jsx` — the opening shot: the real HeaderBar, LayerToggles,
  NearbyPanel and DetailCard fly in from the edges and assemble into the live
  interface, then a soft spotlight lifts the animal card and the title appears.
- `src/scenes/RouteFlythrough.jsx` — a first-person "driver's view" flythrough
  along the real Shibuya → Ueno route geometry: an immersive road in perspective,
  a hazy Tokyo skyline, and the route's animals surfacing along the roadside
  (from the app's real data shapes) as the camera passes them.
- `src/route.js` — Shibuya → Ueno route geometry + roadside encounters, projected
  in a small pseudo-3D perspective model.
- `src/fixture.js` — static data (same shapes as the app's API) so rendering is
  deterministic and offline.
- `src/scenes/video.css` — video-only titles, and overrides that disable the
  app's time-based CSS entrance animations (Remotion drives entrances with
  springs instead).

## Compositions

| ID | What |
|---|---|
| `Opening` | Component-assembly opening shot |
| `RouteFlythrough` | Shibuya → Ueno driver's-view flythrough |

```bash
npm run render        # Opening → out/opening.mp4
npm run render:route  # RouteFlythrough → out/route-flythrough.mp4
```

## Develop

```bash
npm install
npm run studio      # interactive preview at localhost:3000
```

## Render

```bash
npm run render      # → out/opening.mp4
```

If Remotion cannot download its own headless browser (sandboxes/CI), point it at
an existing Chromium headless-shell binary:

```bash
npx remotion render Opening out/opening.mp4 \
  --browser-executable=/path/to/chrome-headless-shell
```

## Roadmap (see PRD notes)

- Replace the CSS map backdrop with a **Playwright-recorded live map** clip for
  full fidelity.
- Upgrade the flythrough to real map tiles via **MapLibre/Mapbox FreeCamera**
  (needs network + tiles; the current scene is a self-contained stylized version
  that renders deterministically offline). Run `npm run capture:route` to fetch
  the exact OSRM geometry first.
- Scene sequencing (intro → nearby → detail → route flythrough → outro).
