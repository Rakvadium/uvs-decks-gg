# TCG Decks verification map

This folder is the maintained source for verifying TCG Decks' user-facing behavior. Read this
index before driving the app, then use the matching feature file as the recipe.

## Baseline preconditions

- `bun .agents/skills/verify-uvs/scripts/launch.ts` printed `READY`, and `doctor.ts` reports all PASS.
- `.env.local` targets a `local:` Convex deployment. Every script refuses otherwise.
- The `LOCAL_TEST_*` account exists (`bun run local:seed --admin`). It has Admin.
- The local snapshot contains the UVS catalog (2,622 cards when this map was written) and the
  Cyberpunk catalog (152).

## Driving conventions

- Write each recipe as a scenario file and run it with `drive.ts`. One `ctx.step` per user action.
- Use `ctx.hosts.uvs` / `.cyberpunk` / `.apex` for multi-game behavior. `hosts.standalone`
  (plain `localhost`) is UVS-only single-game mode, the same mode as Vercel previews.
- Prefer ARIA names with `exact: true`, the auth form ids and card `alt` text over CSS classes
  or DOM position.
- Name created data `verify-uvs-<timestamp>` and delete it in the same scenario.

## Proof and skip reporting

- Proof is the evidence folder: step screenshots, `events.jsonl`, `trace.zip` and `summary.json`.
- For a write, add a step that reopens the data in a second clean context.
- Name the feature file and sub-feature IDs you covered. If an entry point couldn't be reached,
  report the attempted step and the unmet precondition. Never count it as verified through a
  different path.

## Feature entry contract

Each feature file has an H1 and one paragraph, then exactly four H2s: `Sub-features`,
`How to get to it (user POV)`, `Driving it with verify-uvs drive.ts`, and `Gotchas`.

## Features

- [Auth and multi-game hosts](./auth-multi-game.md): sign-in on the apex, return to the game
  host, silent SSO, sign-out, game picker.
- [Card gallery](./gallery.md): browsing, search, facet filters and the URL query on both games.
- [Decks](./decks.md): create, add cards from the gallery, deck details and delete.
- [Community](./community.md): videos, tier lists, rankings and creators.

The Collection page (`/collection`) currently renders "Coming soon"; there is nothing to verify there yet.
