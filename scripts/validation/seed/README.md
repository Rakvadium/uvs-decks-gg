# Validation seed

The golden seed is synthetic, PII-free data for validation backends (see `../README.md`). It is
built from public production reads plus `convex/validationSeed.ts` fixtures.

```sh
bun run validation:seed:reset -- --app-port P          # import golden.zip into a running backend
bun run validation:seed:build -- --app-port P [--no-publish] [--strict] [--pin-catalog]
bun scripts/validation/seed/probe.ts --app-port P      # sha256 per public query; equal across resets
```

## What's in it

- `cards`: the pinned static catalog (front faces) plus the back faces of its dual-faced cards.
  The catalog holds front faces only. The back faces come from `cards:batchGetCardsByIds`, the
  public query the gallery uses for them. `seedFixtures` ignores back faces.
- `sets`, `formats`, `cardLegality`, `setLegality`, facets: public queries. `formatErrata` is left
  empty (`UNREADABLE_TABLES` in `public-data.ts`).
- `cardDataVersion`: production's `catalogUrl` and `catalogSha256` for the pinned version.

## The `validation-seed` branch

It's an orphan branch, and each build adds one commit. `manifest.json` `golden.commit` names the
commit in use.

| File | What |
| --- | --- |
| `golden.zip` | The Convex snapshot `reset` imports |
| `catalog.json.gz` | The pinned catalog's exact bytes (`manifest.json` `catalog.sha256`) |
| `seed.json` | The meta, golden and catalog pins of this commit |
| `vercel.json` | `{"git":{"deploymentEnabled":false}}`, so the branch never deploys |

## Catalog contract

R2 keeps only the latest 5 catalog versions, so the seed stores its own copy.

- The app fetches the seeded `catalogUrl` (an R2 URL) and checks it against `catalogSha256`.
- `reset` copies `catalog.json.gz` from the seed commit to
  `~/.uvs-validation/seed/catalog-<sha12>.json.gz`. It fails before importing if that copy is
  missing or has the wrong sha256.
- To serve the catalog locally, a server for the app calls `pinnedCatalogForUrl(url)` from
  `catalog.ts`. That's the capture tool's `/catalog/` route, once the capture switch wires it in.
  The function returns the verified bytes for the pinned URL and null for any other URL, and never
  contacts R2. Send the bytes with `access-control-allow-origin: *`, as the route does today.
- Until that's wired in, the app still fetches from R2. When R2 stops serving the URL, `reset`
  prints a warning, and the app falls back to Convex sync (slower, but it shows the same cards).
- `build` takes the catalog from the seed branch when it holds the pin, so a rebuild doesn't need
  R2 either. If neither the seed branch nor R2 has the pinned version, it fails and prints the
  re-pin command.

**Re-pin** (moves the seed to the catalog production serves now):
`bun run validation:seed:build -- --app-port P --pin-catalog`. It publishes `golden.zip` and
`catalog.json.gz` together and updates `manifest.json`. Commit the manifest.

## Drift

`manifest.json` `publicReads` records a sha256 per public read: `sets`, `formats`, `cardLegality`,
`setLegality`, `backFaces` and `facets`. `publicReadsSha256` covers all of them. `build` logs each
read that differs from the manifest. With `--strict`, it exits 1 before it starts a backend. Drift
affects rebuilds only, never resets.

## Determinism

The same pins give a byte-identical `golden.zip`. Two backends reset from it return identical
`probe.ts` output.
