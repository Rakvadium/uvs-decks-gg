# Backlog — tcg-decks

Use this list when **no specific task** was assigned. Work from **top to bottom** within each priority band unless an item requires skills or context you do not have—then take the next suitable item.

**Workflow**

1. Pick one **Open** item.
2. Mark it **In progress** (and optionally add your id or date in parentheses).
3. When done, mark **Done** and record a summary in [CHANGELOG.md](./CHANGELOG.md) or the PR description.
4. If you split work, add new backlog rows for the remainder.

Statuses: `Open` | `In progress` | `Blocked` | `Done`

**Coding agents:** Read [agent-onboarding.md](./agent-onboarding.md) before implementation.

**Architecture:** Non-trivial UI must follow [component-architecture-playbook.md](./component-architecture-playbook.md). File-size targets: [CODE_SIZE_POLICY.md](./CODE_SIZE_POLICY.md).

---

## Priority band — product and reliability


| ID    | Status | Area | Summary                                                                                                              |
| ----- | ------ | ---- | -------------------------------------------------------------------------------------------------------------------- |
| P-001 | Open   | Docs | Keep `docs/` aligned with shipped behavior when features change (update SYSTEM_ANALYSIS or feature deep-dives).      |
| P-002 | Open   | QA   | Establish a minimal automated test or smoke checklist (build + lint + critical flows) if not already enforced in CI. |


## Priority band — refactors and hygiene

Refactors should preserve behavior unless explicitly scoped otherwise. Split oversized modules using the playbook.


| ID    | Status | Area    | Summary                                                                                                                      |
| ----- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| R-001 | Open   | Hygiene | Identify the largest route and dialog components; file issues or rows here with concrete target folder layouts per playbook. |


## Priority band — content-first calm UI (chrome mode)

**Goal:** Default to a **calm, content-first** chrome (surfaces, type, controls) while keeping **expressive / futuristic** styling available via `data-chrome` (and optional user preference). Centralize behavior in **tokens + primitives** so feature code does not re-create glow, display fonts, or shadows. See deep-dive analysis in prior planning; implementation follows [component-architecture-playbook.md](./component-architecture-playbook.md).

**Dependency hint:** Complete Epic A (foundation) before wide primitive refactors; migrate feature routes (Epic I) after primitives (C–G) land.

### Epic A — Chrome mode and tokens

| ID       | Status | Area        | Summary                                                                                                                                 |
| -------- | ------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| CALM-001 | Open   | Foundation  | Set `data-chrome` to `calm` or `expressive` on `documentElement`; derive from color-scheme map in `ColorSchemeProvider` (or sibling provider). |
| CALM-002 | Open   | Docs        | Document color-scheme → chrome defaults in one place; how to add new schemes.                                                           |
| CALM-003 | Open   | Foundation  | Add `chrome-calm` / `chrome-expressive` CSS layers: semantic vars (focus shadow, elevation, heading transform, scrollbar).              |
| CALM-004 | Open   | Backend/UI  | Optional Convex `sessions` field `chromePreference` (`auto`, `calm`, or `expressive`) + settings UI; `auto` uses scheme map.                |
| CALM-005 | Open   | Product     | Decide default scheme + chrome for new users; update `DEFAULT_COLOR_SCHEME` / onboarding if needed.                                    |

### Epic B — Typography and headings

| ID       | Status | Area       | Summary                                                                                                 |
| -------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| CALM-006 | Open   | Primitives | Add `PageHeading`, `SectionHeading`, `Kicker` (or equivalent) driven by CSS variables per chrome.     |
| CALM-007 | Open   | Shell      | Migrate shell titles: `brand`, `nav`, `mobile-header`, `expanded-panel`, `slot-grid`.                   |
| CALM-008 | Open   | Gallery    | Migrate gallery headings: stats, no-cards, loading, filter dialog header.                                 |
| CALM-009 | Open   | Decks      | Migrate deck + deck-details titles: `heading`, meta panel, top bar, list/stack group labels.            |
| CALM-010 | Open   | Community  | Migrate community headings: `section-header`, rankings, tier list top bars / lanes.                     |
| CALM-011 | Open   | Cards      | Migrate card details titles: `title-section` (both paths), v2 layout, dialog titles.                    |

### Epic C — Button and badge system

| ID       | Status | Area       | Summary                                                                                                   |
| -------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| CALM-012 | Open   | Primitives | Refactor `button.tsx` variants to token-backed shadows; calm removes outer glow from default/outline/etc. |
| CALM-013 | Open   | UX         | CTA policy: use `default`/`outline` for calm flows; migrate `neon` in empty/auth/home paths.            |
| CALM-014 | Open   | Primitives | Refactor `badge.tsx` with `tone` prop (or equivalent); map to calm vs expressive; keep `variant` alias during migration. |
| CALM-015 | Open   | Migration  | Migrate `Badge variant="cyber"` → semantic tone (e.g. entity); grep-driven.                               |
| CALM-016 | Open   | Migration  | Migrate `Badge variant="neon"`; keep expressive styling behind tokens only.                             |

### Epic D — Card and surface system

| ID       | Status | Area       | Summary                                                                                        |
| -------- | ------ | ---------- | ---------------------------------------------------------------------------------------------- |
| CALM-017 | Open   | Primitives | Split `Card` into variants or add `Surface`: `quiet` (flat border, no gradient wash) vs `fx`/elevated. |
| CALM-018 | Open   | Primitives | `CardTitle` / `CardDescription` defaults from CSS vars per chrome (not forced display/uppercase on calm). |
| CALM-019 | Open   | Community  | Migrate large rounded community sections to `Surface` + token elevation (`community-view/content`). |

### Epic E — Form controls and search

| ID       | Status | Area       | Summary                                                                                      |
| -------- | ------ | ---------- | -------------------------------------------------------------------------------------------- |
| CALM-020 | Open   | Primitives | Refactor `input.tsx` focus/hover to tokens; consider non-mono default for general inputs.    |
| CALM-021 | Open   | Primitives | Refactor `select` + `dropdown-menu` popover chrome to shared shadow/border tokens.           |
| CALM-022 | Open   | Gallery    | Shared `GallerySearchField` (or extend `SearchBar`) for gallery + tier list search controls. |
| CALM-023 | Open   | Gallery    | Filter dialog icon header + option tiles: move glow to expressive tokens only.               |

### Epic F — Overlays, tooltips, sheets

| ID       | Status | Area       | Summary                                                                                   |
| -------- | ------ | ---------- | ----------------------------------------------------------------------------------------- |
| CALM-024 | Open   | Primitives | `tooltip.tsx`: neutral shadow calm vs primary-tint expressive.                          |
| CALM-025 | Open   | Primitives | `dialog.tsx`: title styling via typography roles; drop forced `font-display`+uppercase default. |
| CALM-026 | Open   | Shell      | `draggable-drawer`, `auth-guard`, mobile sheets: tokenized border/shadow (not hardcoded primary glow). |

### Epic G — Globals and motion

| ID       | Status | Area       | Summary                                                                                                 |
| -------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------- |
| CALM-027 | Open   | Globals    | Scrollbar: calm neutral thumb; expressive optional gradient; wire via vars in `base.css`.               |
| CALM-028 | Open   | Globals    | Gate `text-glow`, `border-glow`, `scanlines`, `holo-shimmer` for calm (or require explicit `data-fx`).  |
| CALM-029 | Open   | Cards      | `CARD_GLOW_*` + `card-grid-item/image-stage` holo: calm outline-only path.                              |
| CALM-030 | Open   | Gallery    | `CardGridItemFrame` gradient halo: chrome-aware via prop or CSS (single implementation for all tiles). |

### Epic H — Shell

| ID       | Status | Area   | Summary                                                                                      |
| -------- | ------ | ------ | -------------------------------------------------------------------------------------------- |
| CALM-031 | Open   | Shell  | Left-sidebar frame + right `icon-rail`: tokenize gradients and active-state glow.            |
| CALM-032 | Open   | Gallery | Active deck sidebar slot label: remove primary `drop-shadow` on calm (`slot-components`).   |
| CALM-033 | Open   | Shell  | User menu avatar trigger: calm border without neon shadow (`auth-trigger`).                  |

### Epic I — Pages and flows (feature migration)

| ID       | Status | Area      | Summary                                                                                                   |
| -------- | ------ | --------- | --------------------------------------------------------------------------------------------------------- |
| CALM-034 | Open   | Home      | Home `page.tsx`: `Surface` + calm CTA; reduce gradient hero chrome; preserve layout.                      |
| CALM-035 | Open   | Settings  | Settings `page.tsx`: flat `bg-background` on calm; optional gradient on expressive.                      |
| CALM-036 | Open   | Decks     | Decks view: heading pulse/blur → tokens; empty + auth-required CTAs per CALM-013.                         |
| CALM-037 | Open   | Decks     | Deck grid item + details panel: calm borders/shadows (`deck-grid-item`, `details-panel`).                |
| CALM-038 | Open   | Deck      | Deck details: loader, hero gradients, `deck-list-item` shadows.                                         |
| CALM-039 | Open   | Deck      | Card details dialog in deck flow: `card-details/dialog` buttons use button tokens.                        |
| CALM-040 | Open   | Gallery   | Gallery main: list items, loading, preview dialog align with Surface + frame policy.                    |
| CALM-041 | Open   | Cards     | Card details v2 + original: image halos, panels, keyword badges.                                          |
| CALM-042 | Open   | Community | Creator program hero: `SectionFx` wrapper or expressive-only (`border-glow`, `holo-shimmer`, text glow). |
| CALM-043 | Open   | Community | Media feed: `scanlines` only when expressive (`media-feed-section`).                                    |
| CALM-044 | Open   | Community | Tier lists: search (CALM-022) + badges + headings.                                                      |
| CALM-045 | Open   | Community | Community rankings: badges + headings (CALM-014–CALM-015 + typography).                                 |

### Epic J — QA, docs, cleanup

| ID       | Status | Area   | Summary                                                                                    |
| -------- | ------ | ------ | ------------------------------------------------------------------------------------------ |
| CALM-046 | Open   | QA     | UI matrix page or Storybook: primitives × calm vs expressive; screenshot baseline.        |
| CALM-047 | Open   | Hygiene | Post-migration: grep/CI allowlist for forbidden raw glow patterns in app directories.     |
| CALM-048 | Open   | A11y   | Focus visibility and contrast without relying on glow (calm mode).                         |
| CALM-049 | Open   | Perf   | Document fewer blur layers on calm; optional follow-up metrics.                            |


## Priority band — community video feed (YouTube)

Goal: replace static `VIDEO_FEED` in [community-content-data.ts](../src/components/community/community-content-data.ts) with real metadata for **Community Feed** ([media-feed-section.tsx](../src/components/community/sections/media-feed-section.tsx)), using the YouTube Data API v3 with server-side keys and caching. Prefer `playlistItems.list` + `videos.list` (or curated IDs + `videos.list`) over `search.list` for quota.


| ID     | Status | Area   | Summary                                                                                                                                           |
| ------ | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| CF-001 | Open   | Infra  | Create or use a Google Cloud project, enable YouTube Data API v3, issue a **server-only** API key; document env var name(s) and where it is read. |
| CF-002 | Open   | Data   | Define storage for the feed (Convex table and/or config): curated YouTube **video IDs**, optional editorial fields (label, accent, sort order).   |
| CF-003 | Open   | Backend | Implement fetch + normalize: batched `videos.list` (snippet, contentDetails, statistics); optional `channels.list` + `playlistItems.list` for “latest from channel” sync; persist `fetchedAt` and respect a TTL. |
| CF-004 | Open   | UI     | Update `CommunityMediaFeedSection` to consume live data: thumbnails, titles, channel, duration, view counts, and outbound or embed playback; keep playbook layout. |
| CF-005 | Open   | UX/QA  | Loading skeletons, empty and error states, and safe degradation when quota or network fails; verify no API key is exposed to the client bundle.   |
| CF-006 | Open   | Compliance | Align with [YouTube API Services Terms](https://developers.google.com/youtube/terms/api-services-terms-of-service); attribution/branding; monitor daily quota in Cloud Console. |


---

*Add concrete rows as you discover work. Tie entries to sections in [CHANGELOG.md](./CHANGELOG.md) when you complete them.*