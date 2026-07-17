# Demo snapshots

Offline data snapshots for the presentation scenarios live here as
`nearby-<place>.json` and `route-<from>-<to>.json`.

Generate them with real data (run once, needs internet):

```bash
cd app && npm run capture
```

The app serves any snapshot found here instantly and offline. If a snapshot
is missing, that scenario simply falls back to live API calls — nothing
breaks. These files are generated data; committing them is optional.
