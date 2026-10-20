# PR capture

Before/after screenshots, GIFs, and pixel diffs for PRs. Media goes to the orphan `pr-media` branch so it renders inline from `raw.githubusercontent.com`. Several agents can run this at once.

Captures run only against **this worktree's own seeded local validation backend** ([`scripts/validation/`](../validation/README.md)). The cloud deployment that serves the live site is never a capture target, and there is no mode that reads from it.

## One-time setup

In an agent worktree (never the main checkout):

```bash
bun run agent:setup --port 8128     # installs deps + chromium, writes a loopback .env.local, starts and seeds the backend
```

`--port` here and in `capture` is the same app port `P` (8100–8199). It picks the backend's Convex ports. You also need Node 22.18+. `capture` runs on Node, not Bun, because Playwright can't launch Chromium under Bun on Windows. The validation checks it reuses are Bun-only, so it runs them in Bun subprocesses ([`validation.ts`](./validation.ts), `bun run agent:login-url`). The one-line `package.json` here (`"type": "module"`) stops Node's `MODULE_TYPELESS_PACKAGE_JSON` warning on every run. No secret is needed: there is no `AGENT_AUTH_SECRET` and no password.

## Flow

```bash
# 1. Before you edit anything
bun run capture --issue 191 --label before --port 8128 --reseed \
  --routes gallery,decks,guest:gallery --themes default,cyberpunk

# 2. Make the change, then the same command with --label after
bun run capture --issue 191 --label after --port 8128 --reseed \
  --routes gallery,decks,guest:gallery --themes default,cyberpunk

# 3. Side-by-side + diff PNGs + summary.md
bun run capture:compare --issue 191 --base before --head after

# 4. Secret-scan everything under .pr-captures/191/, then push it to pr-media
bun run capture:publish --issue 191
```

Paste `.pr-captures/<issue>/compare-before-vs-after/summary.md` into the PR body. Its image URLs point at `pr-media/<issue>/<label>/...`, so they only resolve after step 4.

## `capture` flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--issue` | required | Output goes to `.pr-captures/<issue>/<label>/` (gitignored). |
| `--label` | required | `before`, `after`, or any `[\w.-]` name. Each run replaces that label's folder. |
| `--port` | required | This worktree's validation app port `P` (8100–8199, the one `agent:setup` claimed). Capture first runs the checks in Target below. Then it uses the server already listening on `P`, or starts `next dev -p <P>` with `NEXT_PUBLIC_CONVEX_URL` set to the backend and stops it at the end. It never runs `convex dev`. A reused server must be running from your own checkout, or you'll capture someone else's code, and its Convex target is checked before the first sign-in. The `next-dev.log` it writes has `code=` and `token=` redacted. |
| `--routes` | `gallery,decks,guest:gallery` | Comma list. Routes sign in as `--persona` unless prefixed `guest:`. The leading `/` is optional, which stops Git Bash rewriting `/gallery` into a path. |
| `--persona` | `alice` | Signed-in routes sign in as `<persona>@validation.invalid`. The seed has `alice`, `bruno`, `chen`, `dana` and `eli` (`alice` owns a public and a private deck). Any other name gets a new, empty account from `mintCode`. A spec route can set `"persona"` too. |
| `--reseed` | off | Resets the backend to the golden seed (`validation:seed:reset`) before this label. Use it for every label you compare, so both start from the same data. |
| `--clock` | off | Epoch ms or an ISO date. Fixes `Date.now()` and `new Date()` in every capture context with Playwright's `clock.setFixedTime` (timers keep running), so relative dates render the same in every run. Sign-in contexts keep the real time. A time later than now is refused, since the auth client would treat its fresh token as expired. |
| `--allow-writes` | off | Forwards Convex writes from the capture browser to the validation backend instead of dropping them (see No Convex writes). It only exists because capture refuses any target but the local backend. Each forwarded write is listed under `forwardedConvexWrites` in `manifest.json`, and the run prints a `WARNING`. Reseed afterwards (or use `--reseed` on the next label). |
| `--spec` | | JSON file used instead of `--routes` (see below). |
| `--viewports` | `desktop,mobile` | `desktop` = 1280×800 @1x. `mobile` = 390×844 @2x, touch. |
| `--themes` | `default` | `data-color-theme` presets (`default`, `cyberpunk`, `calm-storm`, ...). |
| `--modes` | `light,dark` | |
| `--chrome` | `calm` | `data-chrome` value. |
| `--full-page` | off | Full scroll height instead of the viewport. |
| `--gif` | off | Also records the spec's `gif` entry (needs `--spec`). |
| `--gif-width` | `960` | The GIF is downscaled to this width. The `.webm` stays at full size. |
| `--skip-stills` | off | Only record the GIF. |
| `--strict` | off | Exit 1 if any signed-in shot is flagged because the JS theme pin didn't apply (see Client-side theme), or any shot (guest included) never settled within the stability window (`unstable` in `manifest.json`), had a Convex socket outside the proxy (`unproxiedSockets`, see No Convex writes), or the app asked for a catalog other than the pinned one (`catalog.misses`). The manifest and images are still written. Verifiers should always pass it. |

Every route runs for each viewport × theme × mode. Files are named `<route>__<viewport>__<theme>__<mode>.png`. Signed-out routes get a `guest-` prefix.

### Spec file

[`example.spec.json`](./example.spec.json) is the spec used for this tool's own PR (#191). It has three routes and a GIF of the New Deck dialog opening. The shape, abridged:

`"auth": "agent"` means signed in (as `--persona`, or the route's own `"persona"`).

```json
{
  "routes": [
    { "path": "/decks", "auth": "agent" },
    { "path": "/decks", "auth": "agent", "persona": "bruno", "name": "bruno-decks" },
    { "path": "/gallery", "auth": "guest", "name": "guest-gallery-dialog",
      "steps": [{ "click": "<selector>" }, { "waitFor": "[role=\"dialog\"]" }] }
  ],
  "gif": {
    "path": "/decks", "auth": "agent", "viewport": "desktop", "theme": "default", "mode": "dark",
    "steps": [{ "click": "role=button[name=\"New Deck\"]" }, { "waitFor": "[role=\"dialog\"]" }, { "press": "Escape" }]
  }
}
```

Steps: `click`, `hover`, `fill` (+ `value`), `waitFor` (all take Playwright selectors), `press` (a key), `wait` (ms). Stills run their steps before the shot. Capture contexts grant clipboard read/write, so copy buttons show their success toast. The GIF records while its steps run. A route can set `"viewports": ["desktop"]` to override `--viewports`, for example for a menu that only exists on desktop.

## Target

Before it starts a server, opens a browser or clears the label's folder, capture runs these checks in order. Any failure prints the reason and exits 1. Nothing falls back to another target.

1. **Env files and shell.** The same check `agent:setup` runs (`assertEnvFilesLocal` in [`scripts/agent-setup/setup.ts`](../agent-setup/setup.ts), reused, not copied). Every env file Next.js can load under any `NODE_ENV` (`.env.development.local`, `.env.production`, `.env.test.local`, …, plus `.env.local` and `.env`) must point only at a local backend, both one by one and as Next.js itself resolves each mode. The same goes for the shell (for example, no `CONVEX_DEPLOY_KEY`), and `NODE_ENV` must be unset or `development`.
2. **`vconvex --check`.** The check behind `bun run vconvex -- --app-port <P> --check` must report `target=local` and pass every rule.
3. **Backend.** The port's backend must be running and `lib/validationBackend:status` must say it is a validation backend.
4. **Seed.** With `--reseed`, the golden seed is imported first. Then the backend's `validationSeedMeta` must equal `scripts/validation/seed/manifest.json`. A different or missing seed is refused, and the message suggests `--reseed`.
5. **Catalog.** The pinned catalog file must be present with the pinned sha256 (see Card catalog).

Inside the browser, every capture, sign-in and probe context refuses any Convex WebSocket that isn't to the backend's own host (`127.0.0.1:<cloud port>` or `localhost:<cloud port>`) before it connects, and aborts every HTTP request to a `*.convex.cloud` or `*.convex.site` host. A refusal ends the run with exit 1, `--strict` or not. Before the first sign-in, a signed-out probe loads `/agent-login` without a code and waits for the app's Convex socket. A reused server that points anywhere else is caught there, before any code is sent.

`manifest.json` records `backend`, `seedVersion`, `catalogVersion`, `seed` (with `reseeded`), `catalog` (`version`, `url`, `sha256`, `served`, `misses`), `clock`, `personas` and `allowWrites`.

## Guarantees

**Parallel-safe.** Each run has its own `--port` (its own backend), its own `.pr-captures/<issue>/<label>/` folder, its own browser, and its own sign-ins. Publishing never touches your checkout, and it retries when another agent pushed first (see below). Use **one checkout or worktree per concurrent run**: Next allows only one `next dev` per checkout (`.next/dev/lock`). A second run that has to start a server in the same checkout stops with that explanation, unless you point it at the first run's `--port`.

**Sign-in.** Every signed-in shot (and the GIF) signs in on its own, with its own one-time code. Capture runs `bun run agent:login-url -- --app-port <P> --persona <name>`, which mints the code with `agentLogin:mintCode` through the guarded wrapper. That command must name `<persona>@validation.invalid` as the account, or capture refuses. `/agent-login#code=…` then runs in a throwaway context. The code is only in the URL fragment, which the browser never sends to a server. It is single use and expires after 60 seconds. It stays in capture's memory: it never goes into a log, `manifest.json`, an env var or any published file, and a failed sign-in reports only the page's path. The capture context starts from a copy of that sign-in's cookies and storage. So a step that signs out, or reloads and rotates the refresh token, only ends its own shot's session: the next shot still starts signed in. Only reserved `@validation.invalid` personas can sign in this way (`agentLogin:consume` checks that too).

A persona's first sign-in in a run also checks that it has a `sessions` row. Seeded and new personas have none, so `sessions:getSession` would return `null` and the theme pin would have nothing to rewrite. When the row is missing, capture stores the app defaults (`default/system/calm`) through the app's own `sessions:updateSession`, run as that user with `vconvex run --identity` on the local backend, and lists it under `personas[].sessionCreated`. `--reseed` removes the row again.

**No Convex writes.** Every capture context proxies the Convex sync WebSocket and drops all `Mutation` and `Action` frames before they leave the browser. Queries still flow. The app's own background writes, such as `sessions:ensureAppearanceMigrated` and `communityLive:refreshLiveStatus`, never reach the backend, and neither does an accidental click. Each run lists what it dropped under `blockedConvexWrites` in `manifest.json`. `--allow-writes` turns this off for one run (see the flag). Setup writes still happen, all on the local backend: `mintCode` (a code row, and the persona's user on first use), the session row above, and Convex Auth's own session and refresh-token rows. Convex Auth goes through Next's `/api/auth` over HTTP, and each capture context does one refresh-token exchange.

**Sockets outside the proxy.** Playwright only routes WebSockets that pages open. A Convex client in a worker would skip the write blocking, the target check and the theme pin. The app has none, so a per-context tripwire flags the shot instead (`unproxied` on the shot, `unproxiedSockets` at the top of `manifest.json`, a `WARNING`, and `--strict` exits 1). It covers guest shots and each shot's sign-in context too. Note that the writes of such a socket are **not** blocked: the tripwire reports them after the fact. It flags:
- a frame sent on a Convex socket that the proxy never forwarded. Playwright reports every real socket a page or its dedicated workers (nested ones too) open, including the real connection behind each proxied socket. The proxy records each client frame before handing it to that connection, so only an unproxied socket can send an unrecorded frame. Every Convex client starts with a `Connect` frame carrying its own random session id, so an unproxied client that sends anything at all is caught.
- more Convex sockets opened than proxied (a socket that never sends a frame). This is a count, so a proxied socket whose real connection was never made (its page navigated away in between) can offset one silent socket. A silent socket can't read or write anything.
- any SharedWorker (seen by an init script that wraps the `SharedWorker` constructor) or service worker (Playwright's `serviceworker` event) started in the context. Playwright reports no WebSockets for those at all, so starting one is a problem by itself.

"Convex socket" means a URL matching `/api/<version>/sync`, any socket to the backend's host, or any socket to a Convex cloud host.

**Client-side theme.** `--themes`, `--modes`, and `--chrome` never call `updateSession`. There are two layers:

1. **JS state.** The WebSocket proxy rewrites the `sessions:getSession` result the browser receives (`theme`, `chrome`, `colorSource`), so `ColorSchemeProvider`'s `isDark`, `chrome`, and `colorPreset` match the pin. That covers what reads them in JS: the user-menu Light/Dark label and preset checkmark, the mobile profile sheet switch and preset label, Sonner toasts, neon-chrome forks (frosted card controls, `.scanlines`). It also reassembles chunked transitions. The stored session row is untouched. Each signed-in shot (and the GIF) gets a `pin` entry in `manifest.json`: `saved` (the real stored `preset/mode/chrome`), `pinned`, `patched`, `overridden` (patched and different from saved), `problems` and `flagged`. Guest shots have `pin: null`. The top-level `savedAppearance` lists the saved values seen.

   If the rewrite can't apply, it says so instead of quietly falling back. The proxy tracks every `sessions:getSession` subscription of the page being shot, per socket. That page has its own WebSocket route and pin state, installed before it navigates. Any other page in the context (a popup a step opened) falls through to the context's route: its results are rewritten the same way, but they are tracked separately and never reported, so a popup that stays subscribed can't hide the shot page losing its subscription. Tracking is per page, not per frame: an app iframe inside the shot page goes through the page's route and pin, so its subscription counts toward the shot. If the main frame lost its subscription while an app iframe kept one, the shot would still read as `patched`. The app never iframes itself (its only iframes are Twitch and YouTube embeds, which open no Convex socket), and spec steps can't add one. When a socket closes (either side), its subscriptions stop counting, so after a reconnect or reload only the live socket's subscriptions matter. A shot only counts as `patched` when every live subscription's latest result was a `QueryUpdated` with all of `theme` (`light`/`dark`/`system`), `chrome` and `colorSource` (a `preset` with a name, or `custom`) present and valid, and was rewritten. Anything else is a problem:
   - the page never subscribes (renamed query)
   - a subscription has no rewritten result yet (none arrived, or the sync protocol changed shape)
   - no live subscription is left: every one was removed (client `Remove` or server `QueryRemoved`) or its socket closed (e.g. the page signed out, reloaded without re-subscribing, or the provider unmounted)
   - a result is `null`, or is missing fields or has invalid ones (shape change)
   - the query fails
   - an unrecognised frame type, modification type, or a `Transition` without `modifications` arrives on a socket with a session subscription
   - a chunked transition can't be reassembled

   `saved` stays `null` unless it was read from a valid result, so it is never filled in from defaults. The pin state is snapshotted just before every screenshot. A still uses the snapshot taken with its image, and a change in the snapshot restarts the stability window just like a pixel change, so a newly forwarded result has time to render before the shot is accepted. The GIF uses every frame's snapshot plus one taken 500ms after recording ends, and one bad snapshot flags it. Each snapshot also carries two counters: `events` (session-state changes) and `unpinned` (changes that left the shot page not fully rewritten). If `unpinned` moves between snapshots, the page was unpinned at some point in between, so the shot is flagged even when every snapshot looks clean. A signed-in still whose stability window ran out is flagged too, because its image may predate the final state. A result forwarded after the image doesn't count. A shot whose snapshot isn't `patched` is always flagged, even with no specific reason recorded.

   Any problem flags the shot, even when the pin equals the saved appearance: a page that never got a session value shows the app defaults (`system`/`calm`/`default`), not the saved prefs. The shot's `pin.problems` lists why, a `WARNING` prints under it, the shot is listed under `pinFlagged`, and a summary `WARNING` prints at the end. With `--strict` the run then exits 1. To see this path, run with `PR_CAPTURE_TEST_BREAK_PIN=1`, a test-only switch that makes the proxy ignore the session subscription, as if it had been renamed.
2. **DOM.** An init script sets `data-color-theme`, `data-chrome`, `.dark`, and `color-scheme` on `<html>` before the app's scripts run, and a `MutationObserver` re-applies them. This covers first paint, before the session query answers. Playwright's `colorScheme` emulation matches the mode, so `system` mode agrees.

Parallel runs can pin different themes on the same persona without affecting each other. Limitation: signed-out pages have no session, so their JS sees chrome `calm` and preset `default`. Mode is still right via emulation, and CSS still follows the pin. The tool prints a note when a guest route is captured with a non-default theme or chrome.

**Deterministic stills.** Before each shot the tool waits for:
- network idle
- no visible `.animate-pulse`, `.animate-spin`, or `[aria-busy=true]` (up to 60s)
- `document.fonts.ready`
- every on-screen image decoded

Animations and transitions are then forced to 0s, the caret and the Next dev indicator are hidden, `prefers-reduced-motion` is set, and shots repeat until the image (and, for signed-in shots, the pin snapshot) has been unchanged for 2s. Shots that never settle are flagged in the log and in `manifest.json` (`loaded` / `stable`). Unsettled shots are also listed under `unstable`, print a `WARNING`, and fail `--strict`. The data is pinned too: the golden seed (`--reseed`), the pinned catalog and, with `--clock`, the time. So two runs of the same code should differ by ~0%.

**Card catalog.** The catalog comes from the seed's pinned bytes, never from a download. The preflight runs `readPinnedCatalog` from [`scripts/validation/seed/catalog.ts`](../validation/seed/catalog.ts). That is the file `pinnedCatalogForUrl` returns: `~/.uvs-validation/seed/catalog-<sha12>.json.gz`, which `validation:seed:reset` caches from the seed branch. Node re-reads it and checks its sha256 again. Every context answers the request for the pinned URL (`manifest.json` `catalog.url`, the seeded `cardDataVersion.catalogUrl`) from those bytes, with `Access-Control-Allow-Origin: *` added, because R2 only sends CORS headers for the usual origins. Any other `catalog/*.json.gz` URL is aborted, listed under `catalog.misses`, and fails `--strict`. The page then falls back to Convex sync. So captures still work after R2 drops the pinned version, and nothing in capture contacts R2 for the catalog. **Card images still load from public R2** (`pub-…r2.dev`), straight from the browser. They are public, read-only and versioned by card.

## GIFs

`--gif` takes screenshots in a loop while the steps run and encodes them with [`gifenc`](https://github.com/mattdesl/gifenc), a pure-JS encoder (no ffmpeg). Identical frames are merged, and the GIF loops. Playwright's `.webm` of the same session is kept next to it. Frames are resized with `sharp`, which is already a dependency.

## Compare

`capture:compare --issue N --base before --head after [--threshold 0.1]` pairs shots by file name and writes these to `.pr-captures/<issue>/compare-<base>-vs-<head>/`:
- `<name>__side.png`: base and head side by side
- `<name>__diff.png`: pixelmatch diff
- `compare.json`: diff % per pair
- `summary.md`: a table with base / head / side by side / diff / diff %, plus any GIFs in either label, all as raw `pr-media` URLs

If the two shots differ in height, both are padded to the larger one. Unpaired shots are listed. Diff % is computed on the lossless captures. The side-by-side and diff PNGs are palette-quantized with `sharp`, which makes them about 7x smaller, because every publish retry has to fetch `pr-media`.

## Publish

`capture:publish --issue N [--labels before,after,...] [--env-file <file>]...` pushes every `png/gif/webm/md/json` under `.pr-captures/<issue>/` to `pr-media:<issue>/<label>/`. Logs (`next-dev.log`) and other extensions stay behind. Re-publishing a label replaces its folder. Other issues and labels are untouched.

### Secret scan before publishing

`pr-media` is public the moment it's pushed, and CI never scans it. So publish runs the secret scan with `--strict` on exactly what it is about to publish, **before any git write** (no `hash-object`, no commit, no push):

1. It reads each file once into memory. Folders, symlinks and other non-regular files with a media extension abort the publish.
2. It hands those bytes, plus the root `vercel.json`, to the scanner's in-process [`scanBuffers`](../secret-scan/README.md#scanbuffers-in-process), under the paths they'll have on `pr-media`. `scanBuffers` matches and decodes the same way `--path` does, but nothing walks a folder, so no label is skipped. `--path` would skip a label named `node_modules`. It also gets scan-only entries, reported under `_scan-only/`:
   - every tree path and the commit message, since labels end up in both
   - the inflated contents of every compressed PNG text or profile chunk (`zTXt`, `iCCP`, and `iTXt` with any compression flag other than 0, as decoders like Pillow treat every non-zero flag as compressed), in any file to be published, whatever its name. Every PNG signature in the bytes is parsed from there to the end, and a `.png` file that doesn't start with one aborts. Every zlib stream in a chunk is inflated in turn, until the chunk's data is used up. The scanner reads raw bytes, so it can't see inside these. A PNG whose chunks can't be parsed, a stream that won't inflate, or leftover bytes after the last stream abort the publish. Inflating is capped at **64 MiB per chunk** (all its streams together) and **256 MiB per publish**. Going over either cap is exit 2, before any git write, so a decompression bomb can't exhaust memory. A real capture's PNGs have no compressed chunks at all.
3. The process env is checked too.
4. **Any non-zero exit aborts**, before anything is written to git:
   - `1`: a hit, printed as `VAR_NAME <path>:<line>`, never the value
   - `2`: the scan couldn't run completely: an unreadable env file, zero values loaded, or a missing required value

   The blobs are then written from the same in-memory bytes, so what was scanned is what gets published. `--stdin` hashing applies no CRLF or attribute filters.

Errors before the scan never print a label, file name, unknown flag or stray argument, since any of them could hold a value. For example, a `--labels` name that isn't a folder is reported by count only, and an unknown flag as `unknown flag (not printed)`.

**Env files.** The main checkout's two files, `.env.local.live-backup` and `data/live-env-no-r2.txt`, are always used when they exist. Publish finds the main checkout with `git rev-parse --git-common-dir`, so this also works from a worktree. Each `--env-file` (repeatable; a bare `--env-file` is refused) **adds** to them and never replaces them, so an env file of dummy values can't hide the real ones. With no `--env-file`, both default files are required: if either is missing, the scan exits 2 and nothing is published. There is **no flag to skip the scan**. Without a main checkout's env files (for example, a cloud agent), you can only publish with an `--env-file` that holds every required value.

**Not covered.** The scanner's own limits apply ([What is not detected](../secret-scan/README.md#what-is-not-detected)). For media, the ones that matter are:
- values drawn into pixels (a screenshot of a token), including GIF and WebM frames
- other compressed data: PNG image data (`IDAT`, APNG `fdAT`), compressed data outside a PNG chunk (for example, a raw zlib stream inside a `.json`), and anything inside a WebM stream

Don't capture pages that show secret values.

It uses git plumbing only (`hash-object`, a throwaway `GIT_INDEX_FILE`, `commit-tree`, `push <sha>:refs/heads/pr-media`). Your branch, index, and working tree are never touched. If `pr-media` doesn't exist yet, the first commit creates it as an orphan. On a rejected push (another agent published first) it re-reads the remote tip, rebuilds on top, and retries with backoff (up to 6 attempts). Every commit also carries a root `vercel.json` with `{"git":{"deploymentEnabled":false}}`. Without it, each push to `pr-media` (which contains no app) triggers a failing Vercel preview deployment.

URL shape: `https://raw.githubusercontent.com/<owner>/<repo>/pr-media/<issue>/<label>/<file>`.

## Verifying someone else's PR

Check out the PR head in your own worktree and run `bun run agent:setup --port <your P>`. Then run `capture --label verify --reseed` with the same routes, themes, persona and clock on your own port, and compare it against theirs:

```bash
git fetch origin pr-media
mkdir -p .pr-captures && git archive origin/pr-media 191/after | tar -x -C .pr-captures   # their after shots
bun run capture --issue 191 --label verify --port 8129 --reseed --strict --routes gallery,decks,guest:gallery --themes default,cyberpunk
bun run capture:compare --issue 191 --base after --head verify
```

A diff near 0% means you reproduced their After. Both runs used the same golden seed and catalog, so a real difference is a code difference. Captures made before the switch to validation backends showed live data, so they can't be compared with these.

### Test-only switches

- `PR_CAPTURE_TEST_BREAK_PIN=1`: see Client-side theme.
- `PR_CAPTURE_TEST_CODE_SINK=<file outside the checkout>`: appends every login code capture mints to that file, so a verifier can grep the output for codes that were really used. The codes are already burned by then (single use, 60 seconds, local backend only). A path inside the checkout is refused.
