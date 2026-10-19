# PR capture

Before/after screenshots, GIFs, and pixel diffs for PRs. Media goes to the orphan `pr-media` branch so it renders inline from `raw.githubusercontent.com`. Several agents can run this at once.

## One-time setup

```bash
bun install
bunx playwright install chromium
```

You need `.env.local` with `AGENT_AUTH_SECRET` (see [agent-onboarding.md](../../docs/agent-onboarding.md) §6) and Node 22.18+. `capture` runs on Node, not Bun, because Playwright can't launch Chromium under Bun on Windows.

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
| `--port` | required | Uses the server already listening on this port, or starts `next dev -p <port>` and stops it at the end. It never runs `convex dev`. Pick a port no other agent uses. A reused server must be running from your own checkout, or you'll capture someone else's code. |
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

Steps: `click`, `hover`, `fill` (+ `value`), `waitFor` (all take Playwright selectors), `press` (a key), `wait` (ms). Stills run their steps before the shot. The GIF records while its steps run.

## Guarantees

**Parallel-safe.** Each run has its own `--port`, its own `.pr-captures/<issue>/<label>/` folder, its own browser, and a single agent sign-in. Publishing never touches your checkout, and it retries when another agent pushed first (see below).

**No Convex writes.** Every capture context proxies the Convex sync WebSocket and drops all `Mutation` and `Action` frames before they leave the browser. Queries still flow. The app's own background writes, such as `sessions:ensureAppearanceMigrated` and `communityLive:refreshLiveStatus`, never reach the shared deployment, and neither does an accidental click. Each run lists what it dropped under `blockedConvexWrites` in `manifest.json`. The only server-side write is the agent sign-in, which goes through Next's `/api/auth` over HTTP.

**Client-side theme.** `--themes`, `--modes`, and `--chrome` never call `updateSession`. An init script sets `data-color-theme`, `data-chrome`, `.dark`, and `color-scheme` on `<html>` before the app's scripts run. A `MutationObserver` re-applies them whenever `ColorSchemeProvider` writes the `agent` user's session values back. Playwright's `colorScheme` emulation also matches the mode, so `system` mode and guests agree. Parallel runs can use different themes on the same `agent` user without affecting each other. Limitation: a component that branches in JS on `useColorScheme().isDark` or on chrome still sees the session value. The CSS tokens, which cover nearly everything, follow the pin.

**Deterministic stills.** Before each shot the tool waits for:
- network idle
- no visible `.animate-pulse`, `.animate-spin`, or `[aria-busy=true]` (up to 60s)
- `document.fonts.ready`
- every on-screen image decoded

Animations and transitions are then forced to 0s, the caret and the Next dev indicator are hidden, `prefers-reduced-motion` is set, and shots repeat until two in a row are byte-identical. Shots that never settle are flagged in the log and in `manifest.json` (`loaded` / `stable`). Two runs of the same state should differ by ~0%. Anything left over is live data changing on the shared deployment.

**Card catalog.** The R2 static catalog only sends CORS headers for the usual origins. On other ports the gallery would fall back to a rate-limited Convex sync, which these captures block. So the capture downloads `catalog/*.json.gz` once from Node and serves the same bytes to every capture context with `Access-Control-Allow-Origin` added. This is read-only and happens only inside the capture browser. It also removes R2 latency, which used to make card-derived content (such as deck art on `/decks`) show up after the page already looked settled.

## GIFs

`--gif` takes screenshots in a loop while the steps run and encodes them with [`gifenc`](https://github.com/mattdesl/gifenc), a pure-JS encoder (no ffmpeg). Identical frames are merged, and the GIF loops. Playwright's `.webm` of the same session is kept next to it. Frames are resized with `sharp`, which is already a dependency.

## Compare

`capture:compare --issue N --base before --head after [--threshold 0.1]` pairs shots by file name and writes these to `.pr-captures/<issue>/compare-<base>-vs-<head>/`:
- `<name>__side.png`: base and head side by side
- `<name>__diff.png`: pixelmatch diff
- `compare.json`: diff % per pair
- `summary.md`: a table with base / head / side by side / diff / diff %, plus any GIFs in either label, all as raw `pr-media` URLs

If the two shots differ in height, both are padded to the larger one. Unpaired shots are listed.

## Publish

`capture:publish --issue N [--labels before,after,...]` pushes every `png/gif/webm/md/json` under `.pr-captures/<issue>/` to `pr-media:<issue>/<label>/`. Re-publishing a label replaces its folder. Other issues and labels are untouched.

It uses git plumbing only (`hash-object`, a throwaway `GIT_INDEX_FILE`, `commit-tree`, `push <sha>:refs/heads/pr-media`). Your branch, index, and working tree are never touched. If `pr-media` doesn't exist yet, the first commit creates it as an orphan. On a rejected push (another agent published first) it re-reads the remote tip, rebuilds on top, and retries with backoff (up to 6 attempts).

URL shape: `https://raw.githubusercontent.com/<owner>/<repo>/pr-media/<issue>/<label>/<file>`.

## Verifying someone else's PR

Check out the PR head in your own worktree. Then run `capture --label verify` with the same routes and themes on your own port, and compare it against theirs:

```bash
git fetch origin pr-media
mkdir -p .pr-captures && git archive origin/pr-media 191/after | tar -x -C .pr-captures   # their after shots
bun run capture --issue 191 --label verify --port 8102 --routes gallery,decks,guest:gallery --themes default,cyberpunk
bun run capture:compare --issue 191 --base after --head verify
```

A diff near 0% means you reproduced their After. Remember that live data on the shared deployment can move between runs.
