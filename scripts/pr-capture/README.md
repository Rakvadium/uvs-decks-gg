# PR capture

Before/after screenshots, GIFs, and pixel diffs for PRs. Media goes to the orphan `pr-media` branch so it renders inline from `raw.githubusercontent.com`. Several agents can run this at once.

## One-time setup

```bash
bun install
bunx playwright install chromium
```

You need `.env.local` with `AGENT_AUTH_SECRET` (see [agent-onboarding.md](../../docs/agent-onboarding.md) §6) and Node 22.18+. `capture` runs on Node, not Bun, because Playwright can't launch Chromium under Bun on Windows. The one-line `package.json` here (`"type": "module"`) stops Node's `MODULE_TYPELESS_PACKAGE_JSON` warning on every run.

## Flow

```bash
# 1. Before you edit anything
bun run capture --issue 191 --label before --port 8101 \
  --routes gallery,decks,guest:gallery --themes default,cyberpunk

# 2. Make the change, then the same command with --label after
bun run capture --issue 191 --label after --port 8101 \
  --routes gallery,decks,guest:gallery --themes default,cyberpunk

# 3. Side-by-side + diff PNGs + summary.md
bun run capture:compare --issue 191 --base before --head after

# 4. Push everything under .pr-captures/191/ to pr-media
bun run capture:publish --issue 191
```

Paste `.pr-captures/<issue>/compare-before-vs-after/summary.md` into the PR body. Its image URLs point at `pr-media/<issue>/<label>/...`, so they only resolve after step 4.

## `capture` flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--issue` | required | Output goes to `.pr-captures/<issue>/<label>/` (gitignored). |
| `--label` | required | `before`, `after`, or any `[\w.-]` name. Each run replaces that label's folder. |
| `--port` | required | Uses the server already listening on this port, or starts `next dev -p <port>` and stops it at the end. It never runs `convex dev`. Pick a port no other agent uses. A reused server must be running from your own checkout, or you'll capture someone else's code. The `next-dev.log` it writes has `token=` redacted. |
| `--routes` | `gallery,decks,guest:gallery` | Comma list. Routes sign in as `agent` unless prefixed `guest:`. The leading `/` is optional, which stops Git Bash rewriting `/gallery` into a path. |
| `--spec` | | JSON file used instead of `--routes` (see below). |
| `--viewports` | `desktop,mobile` | `desktop` = 1280×800 @1x. `mobile` = 390×844 @2x, touch. |
| `--themes` | `default` | `data-color-theme` presets (`default`, `cyberpunk`, `calm-storm`, ...). |
| `--modes` | `light,dark` | |
| `--chrome` | `calm` | `data-chrome` value. |
| `--full-page` | off | Full scroll height instead of the viewport. |
| `--gif` | off | Also records the spec's `gif` entry (needs `--spec`). |
| `--gif-width` | `960` | The GIF is downscaled to this width. The `.webm` stays at full size. |
| `--skip-stills` | off | Only record the GIF. |
| `--strict` | off | Exit 1 if any signed-in shot is flagged because the JS theme pin didn't apply (see Client-side theme). The manifest and images are still written. Verifiers should always pass it. |

Every route runs for each viewport × theme × mode. Files are named `<route>__<viewport>__<theme>__<mode>.png`. Signed-out routes get a `guest-` prefix.

### Spec file

[`example.spec.json`](./example.spec.json) is the spec used for this tool's own PR (#191). It has three routes and a GIF of the New Deck dialog opening. The shape, abridged:

```json
{
  "routes": [
    { "path": "/decks", "auth": "agent" },
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

## Guarantees

**Parallel-safe.** Each run has its own `--port`, its own `.pr-captures/<issue>/<label>/` folder, its own browser, and a single agent sign-in. Publishing never touches your checkout, and it retries when another agent pushed first (see below). Use **one checkout or worktree per concurrent run**: Next allows only one `next dev` per checkout (`.next/dev/lock`). A second run that has to start a server in the same checkout stops with that explanation, unless you point it at the first run's `--port`.

**No Convex writes.** Every capture context proxies the Convex sync WebSocket and drops all `Mutation` and `Action` frames before they leave the browser. Queries still flow. The app's own background writes, such as `sessions:ensureAppearanceMigrated` and `communityLive:refreshLiveStatus`, never reach the shared deployment, and neither does an accidental click. Each run lists what it dropped under `blockedConvexWrites` in `manifest.json`. Convex Auth is the exception, because it goes through Next's `/api/auth` over HTTP. The run signs in once (`/agent-login`, which creates an auth session for `agent`). After that, every capture context does one refresh-token exchange (`auth:signIn` with a refresh token), roughly one per shot. Those write only to Convex Auth's session and refresh-token tables, and only for that run's own `agent` session. App data and the `agent` user's preferences are never written.

**Client-side theme.** `--themes`, `--modes`, and `--chrome` never call `updateSession`. There are two layers:

1. **JS state.** The WebSocket proxy rewrites the `sessions:getSession` result the browser receives (`theme`, `chrome`, `colorSource`), so `ColorSchemeProvider`'s `isDark`, `chrome`, and `colorPreset` match the pin. That covers what reads them in JS: the user-menu Light/Dark label and preset checkmark, the mobile profile sheet switch and preset label, Sonner toasts, neon-chrome forks (frosted card controls, `.scanlines`). It also reassembles chunked transitions. The stored session row is untouched. Each signed-in shot (and the GIF) gets a `pin` entry in `manifest.json`: `saved` (the real stored `preset/mode/chrome`), `pinned`, `patched`, `overridden` (patched and different from saved), `problems` and `flagged`. Guest shots have `pin: null`. The top-level `savedAppearance` lists the saved values seen.

   If the rewrite can't apply, it says so instead of quietly falling back. The proxy tracks every `sessions:getSession` subscription in the context, on every socket (reconnects included). A shot only counts as `patched` when every live subscription's latest result was a `QueryUpdated` with all of `theme` (`light`/`dark`/`system`), `chrome` and `colorSource` (a `preset` with a name, or `custom`) present and valid, and was rewritten. Anything else is a problem:
   - the page never subscribes (renamed query)
   - a subscription has no rewritten result yet (none arrived, or the sync protocol changed shape)
   - a result is `null`, or is missing fields or has invalid ones (shape change)
   - the query fails
   - an unrecognised frame type, modification type, or a `Transition` without `modifications` arrives on a socket with a session subscription
   - a chunked transition can't be reassembled

   `saved` stays `null` unless it was read from a valid result, so it is never filled in from defaults. The pin state is snapshotted just before the screenshot that produced the still, and at the GIF's first and last frames. A result forwarded after that moment doesn't count.

   Any problem flags the shot, even when the pin equals the saved appearance: a page that never got a session value shows the app defaults (`system`/`calm`/`default`), not the saved prefs. The shot's `pin.problems` lists why, a `WARNING` prints under it, the shot is listed under `pinFlagged`, and a summary `WARNING` prints at the end. With `--strict` the run then exits 1. To see this path, run with `PR_CAPTURE_TEST_BREAK_PIN=1`, a test-only switch that makes the proxy ignore the session subscription, as if it had been renamed.
2. **DOM.** An init script sets `data-color-theme`, `data-chrome`, `.dark`, and `color-scheme` on `<html>` before the app's scripts run, and a `MutationObserver` re-applies them. This covers first paint, before the session query answers. Playwright's `colorScheme` emulation matches the mode, so `system` mode agrees.

Parallel runs can pin different themes on the same `agent` user without affecting each other. Limitation: signed-out pages have no session, so their JS sees chrome `calm` and preset `default`. Mode is still right via emulation, and CSS still follows the pin. The tool prints a note when a guest route is captured with a non-default theme or chrome.

**Deterministic stills.** Before each shot the tool waits for:
- network idle
- no visible `.animate-pulse`, `.animate-spin`, or `[aria-busy=true]` (up to 60s)
- `document.fonts.ready`
- every on-screen image decoded

Animations and transitions are then forced to 0s, the caret and the Next dev indicator are hidden, `prefers-reduced-motion` is set, and shots repeat until two in a row are byte-identical. Shots that never settle are flagged in the log and in `manifest.json` (`loaded` / `stable`). Two runs of the same state should differ by ~0%. Anything left over is live data changing on the shared deployment.

**Card catalog.** The R2 static catalog only sends CORS headers for the usual origins. On other ports the gallery would fall back to a rate-limited Convex sync, which these captures block. So the capture downloads `catalog/*.json.gz` once from Node and serves the same bytes to every capture context with `Access-Control-Allow-Origin` added. This is read-only and happens only inside the capture browser. A failed download (HTTP error, or 30s timeout) is not cached. The browser request fails immediately and a warning is printed. Only the failed download itself is evicted, so a context still waiting on it can't evict a newer retry. It also removes R2 latency, which used to make card-derived content (such as deck art on `/decks`) show up after the page already looked settled.

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

`capture:publish --issue N [--labels before,after,...]` pushes every `png/gif/webm/md/json` under `.pr-captures/<issue>/` to `pr-media:<issue>/<label>/`. Re-publishing a label replaces its folder. Other issues and labels are untouched.

It uses git plumbing only (`hash-object`, a throwaway `GIT_INDEX_FILE`, `commit-tree`, `push <sha>:refs/heads/pr-media`). Your branch, index, and working tree are never touched. If `pr-media` doesn't exist yet, the first commit creates it as an orphan. On a rejected push (another agent published first) it re-reads the remote tip, rebuilds on top, and retries with backoff (up to 6 attempts). Every commit also carries a root `vercel.json` with `{"git":{"deploymentEnabled":false}}`. Without it, each push to `pr-media` (which contains no app) triggers a failing Vercel preview deployment.

URL shape: `https://raw.githubusercontent.com/<owner>/<repo>/pr-media/<issue>/<label>/<file>`.

## Verifying someone else's PR

Check out the PR head in your own worktree. Then run `capture --label verify` with the same routes and themes on your own port, and compare it against theirs:

```bash
git fetch origin pr-media
mkdir -p .pr-captures && git archive origin/pr-media 191/after | tar -x -C .pr-captures   # their after shots
bun run capture --issue 191 --label verify --port 8102 --strict --routes gallery,decks,guest:gallery --themes default,cyberpunk
bun run capture:compare --issue 191 --base after --head verify
```

A diff near 0% means you reproduced their After. Remember that live data on the shared deployment can move between runs.
