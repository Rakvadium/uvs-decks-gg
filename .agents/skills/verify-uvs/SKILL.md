---
name: verify-uvs
description: Drive the real TCG Decks web app (Next.js + local Convex; UniVersus and Cyberpunk game hosts) in an isolated headless Chrome and capture proof. Use when you need to show a UI or backend change working end to end in a browser, beyond typecheck and unit tests, or to reproduce a bug in the running app.
---

# verify-uvs

Proves behavior in the running app. A scenario script drives a fresh Chrome context through
Playwright (`playwright-core`, using the installed Chrome) and records screenshots, a trace and
browser errors. All commands run from the repo root (or a worktree root) with Bun.

**Production guard.** Production Convex is `honorable-shrimp-618`. Every script here refuses to
run unless `.env.local` targets a `local:` deployment on loopback. Never point these scripts at
production, and never run Convex CLI commands against it without the owner's approval.

## Launch

```sh
bun .agents/skills/verify-uvs/scripts/launch.ts
```

- Reuses a Convex backend already answering on `:3210`. If none is running, it starts
  `bunx convex dev` (one per machine; it pushes *this* checkout's `convex/` to the shared backend).
- Reuses a Next server already answering on `PORT` from `.env.local` (default 8090; worktrees get
  8091–8099). If none is running, it starts `bun run dev`.
- Only processes it starts get a pid file in `.verify-uvs/`. Their logs go to
  `.verify-uvs/next.log` and `.verify-uvs/convex.log`.
- Ready means it prints `READY {"apex":…,"uvs":…,"cyberpunk":…,"standalone":…}`. The first gallery
  compile can take a minute or two.

In a new worktree, run `bun install` and `bun run worktree:setup` first (see AGENTS.md).

## Doctor

```sh
bun .agents/skills/verify-uvs/scripts/doctor.ts
```

Read-only. It checks the local env target, the backend on `:3210`, the UVS gallery, the Cyberpunk
gallery and the apex sign-in (each must return below HTTP 400), any pid files, the `LOCAL_TEST_*`
account and Chrome. It exits 1 on any FAIL. Run it first, and again whenever something looks off.

- `test account … missing`: run `bun run local:seed --admin`. It is safe to rerun and also
  recreates the account after a data refresh.
- Gallery loads but cards come from a slow Convex sync with a 404 on `/catalog-proxy/…`: the local
  snapshot is stale. See "Refreshing data" in `docs/local-convex.md`. The export step needs the
  owner's approval.

## Drive

```sh
bun .agents/skills/verify-uvs/scripts/drive.ts <scenario.ts> [--name <label>] [--headed] [--mobile]
```

A scenario default-exports `async (ctx: DriveContext) => void`. Start from
`scenarios/smoke.ts`. Put one-off scenarios in `.verify-uvs/tmp/` (gitignored). Commit reusable
ones to `scenarios/`. `ctx` provides:

| Member | Use |
| --- | --- |
| `page`, `context` | Playwright page and its isolated context (fresh profile each run) |
| `hosts` | `apex`, `uvs`, `cyberpunk`, `standalone` base URLs for this checkout's port |
| `signIn(from?)` | Signs in as `LOCAL_TEST_*` through the real form and waits until it leaves `/sign-in` and `/auth/*`. Defaults to the UVS gallery |
| `step(label, fn)` | Runs a named step, takes a screenshot after it, records pass/fail and rethrows on failure |
| `shot(label)` | Takes an extra screenshot |
| `log(msg)` | Writes to stdout and `events.jsonl` |

`--mobile` emulates an iPhone 13 (mobile shell and tab bar). `--headed` shows the browser.

Shipped scenarios:

- `scenarios/smoke.ts` (read-only): signed-out gallery search, sign-in round trip, silent SSO on
  Cyberpunk.
- `scenarios/deck-lifecycle.ts` (writes): create a deck, add a card from the gallery, confirm it in
  a second clean context, then delete the deck.

Handles that hold up in this app: element ids on the auth forms (`#sign-in-email`,
`#sign-in-password`, `#create-deck-name`), ARIA names (`Search cards`, `New Deck`,
`Add to deck`, `Delete deck`, `Edit <Facet> filter`), card images by `alt` (the card name), and
route paths. Use `exact: true` on role names, because several labels are prefixes of others.
Per-feature recipes are in `features/README.md`.

### Isolation

- Each drive gets its own browser context, so it never touches your real browser session.
- The **Convex backend is shared** by every checkout and worktree on the machine, and there is
  only one Next dev server per checkout. Don't run two `convex dev` processes. Write scenarios
  that create their own data (named `verify-uvs-<timestamp>`) and delete it. Never edit or
  delete data you didn't create.
- Cookies ignore ports, so drives on `*.tcgdecks.localhost` from two checkouts can share a
  session only within one context. Separate contexts stay separate.

## Evidence

Each run writes `.verify-uvs/evidence/<UTC timestamp>-<name>/`:

- `NN-<step>.png`: one screenshot per step. Failures are saved as `NN-FAILED-<step>.png`.
- `events.jsonl`: console errors and warnings, page errors, failed requests and HTTP >= 400 responses.
- `trace.zip`: the full Playwright trace. Open it with `bunx playwright-core show-trace <path>`.
- `summary.json`: steps with pass/fail, the final URL and event counts.

Proof standards:

- Drive the real user path: clicks, typing and navigation. Don't call Convex functions or set
  state directly.
- Capture the action and the state it produced. One step per user action gives you before/after
  screenshots for free.
- Verify side effects separately from what is on screen. For writes, reopen the data in a
  **second clean context** (`context.browser()!.newContext({ storageState: await context.storageState() })`),
  which has no IndexedDB or catalog cache, so it reads what the backend stored. See `deck-lifecycle.ts`.
- When the change is about errors or performance, read `events.jsonl`. A `PASSED` with new
  `pageerror` entries is not a pass.
- Report the evidence folder path and point to the screenshots that show the claim. Don't claim
  coverage of an entry point you didn't drive.

## Cleanup

```sh
bun .agents/skills/verify-uvs/scripts/cleanup.ts
```

Stops only the processes `launch.ts` started (it tree-kills the pids in `.verify-uvs/*.pid`) and
deletes their logs. It never kills by name or port, so a dev server the user started keeps
running. `.verify-uvs/evidence/` is kept. Delete old evidence folders by hand when they're no
longer needed. A worktree's evidence goes away when the worktree is removed, so copy anything you
need to keep first.

Also delete any data a failed scenario left behind (decks named `verify-uvs-*`) through the UI,
the same way `deck-lifecycle.ts` does its delete step.
