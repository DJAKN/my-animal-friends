# My Animal Friends — Pitch video

A [Remotion](https://remotion.dev) project that composes the pitch video from
the **real app components** (imported from `../app/src`), so what you see in the
video is the actual product UI — not a mockup or an AI-generated impression.

## What's here

- `src/scenes/Opening.jsx` — the opening shot: the real HeaderBar, LayerToggles,
  NearbyPanel and DetailCard fly in from the edges and assemble into the live
  interface, then a soft spotlight lifts the animal card and the title appears.
- `src/fixture.js` — static data (same shapes as the app's API) so rendering is
  deterministic and offline.
- `src/scenes/video.css` — video-only titles, and overrides that disable the
  app's time-based CSS entrance animations (Remotion drives entrances with
  springs instead).

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
- Add the **Route "driver's-view" flythrough** using MapLibre/Mapbox FreeCamera
  along the real OSRM route, with animals surfacing as the camera passes.
- Scene sequencing (intro → nearby → detail → route flythrough → outro).
