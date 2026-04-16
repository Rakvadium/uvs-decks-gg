**Status:** Archived as of 2026-04-16 — active backlog is [../BACKLOG.md](../BACKLOG.md).

# Backlog (completed work) — tcg-decks

Historical **Done** rows moved from the main backlog. For current work, use [../BACKLOG.md](../BACKLOG.md).

---

## Priority band — product and reliability


| ID    | Status | Area | Summary                                                                                                              |
| ----- | ------ | ---- | -------------------------------------------------------------------------------------------------------------------- |
| P-001 | Done   | Docs | Keep `docs/` aligned with shipped behavior when features change (update SYSTEM_ANALYSIS or feature deep-dives).      |
| P-002 | Done   | QA   | Establish a minimal automated test or smoke checklist (build + lint + critical flows) if not already enforced in CI. |


## Priority band — refactors and hygiene

Refactors should preserve behavior unless explicitly scoped otherwise. Split oversized modules using the playbook.


| ID    | Status | Area    | Summary                                                                                                                      |
| ----- | ------ | ------- | ---------------------------------------------------------------------------------------------------------------------------- |
| R-001 | Done   | Hygiene | Identify the largest route and dialog components; file issues or rows here with concrete target folder layouts per playbook. |


## Priority band — content-first calm UI (chrome mode)

**Goal:** Default to a **calm, content-first** chrome (surfaces, type, controls) while keeping **expressive / futuristic** styling available via `data-chrome` (and optional user preference). Centralize behavior in **tokens + primitives** so feature code does not re-create glow, display fonts, or shadows. See deep-dive analysis in prior planning; implementation follows [component-architecture-playbook.md](../component-architecture-playbook.md).

**Dependency hint:** Complete Epic A (foundation) before wide primitive refactors; migrate feature routes (Epic I) after primitives (C–G) land.

### Epic A — Chrome mode and tokens


| ID       | Status | Area       | Summary                                                                                                                                        |
| -------- | ------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| CALM-001 | Done   | Foundation | Set `data-chrome` to `calm` or `expressive` on `documentElement`; derive from color-scheme map in `ColorSchemeProvider` (or sibling provider). |
| CALM-002 | Done   | Docs       | Document color-scheme → chrome defaults in one place; how to add new schemes.                                                                  |
| CALM-003 | Done   | Foundation | Add `chrome-calm` / `chrome-expressive` CSS layers: semantic vars (focus shadow, elevation, heading transform, scrollbar).                     |
| CALM-004 | Done   | Backend/UI | Optional Convex `sessions` field `chromePreference` (`auto`, `calm`, or `expressive`) + settings UI; `auto` uses scheme map.                   |
| CALM-005 | Done   | Product    | Decide default scheme + chrome for new users; update `DEFAULT_COLOR_SCHEME` / onboarding if needed.                                            |


### Epic B — Typography and headings


| ID       | Status | Area       | Summary                                                                                           |
| -------- | ------ | ---------- | ------------------------------------------------------------------------------------------------- |
| CALM-006 | Done   | Primitives | Add `PageHeading`, `SectionHeading`, `Kicker` (or equivalent) driven by CSS variables per chrome. |
| CALM-007 | Done   | Shell      | Migrate shell titles: `brand`, `nav`, `mobile-header`, `expanded-panel`, `slot-grid`.             |
| CALM-008 | Done   | Gallery    | Migrate gallery headings: stats, no-cards, loading, filter dialog header.                         |
| CALM-009 | Done   | Decks      | Migrate deck + deck-details titles: `heading`, meta panel, top bar, list/stack group labels.      |
| CALM-010 | Done   | Community  | Migrate community headings: `section-header`, rankings, tier list top bars / lanes.               |
| CALM-011 | Done   | Cards      | Migrate card details titles: `title-section` (both paths), v2 layout, dialog titles.              |


### Epic C — Button and badge system


| ID       | Status | Area       | Summary                                                                                                                  |
| -------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| CALM-012 | Done   | Primitives | Refactor `button.tsx` variants to token-backed shadows; calm removes outer glow from default/outline/etc.                |
| CALM-013 | Done   | UX         | CTA policy: use `default`/`outline` for calm flows; migrate `neon` in empty/auth/home paths.                             |
| CALM-014 | Done   | Primitives | Refactor `badge.tsx` with `tone` prop (or equivalent); map to calm vs expressive; keep `variant` alias during migration. |
| CALM-015 | Done   | Migration  | Migrate `Badge variant="cyber"` → semantic tone (e.g. entity); grep-driven.                                              |
| CALM-016 | Done   | Migration  | Migrate `Badge variant="neon"`; keep expressive styling behind tokens only.                                              |


### Epic D — Card and surface system


| ID       | Status | Area       | Summary                                                                                                   |
| -------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------- |
| CALM-017 | Done   | Primitives | Split `Card` into variants or add `Surface`: `quiet` (flat border, no gradient wash) vs `fx`/elevated.    |
| CALM-018 | Done   | Primitives | `CardTitle` / `CardDescription` defaults from CSS vars per chrome (not forced display/uppercase on calm). |
| CALM-019 | Done   | Community  | Migrate large rounded community sections to `Surface` + token elevation (`community-view/content`).       |


### Epic E — Form controls and search


| ID       | Status | Area       | Summary                                                                                      |
| -------- | ------ | ---------- | -------------------------------------------------------------------------------------------- |
| CALM-020 | Done   | Primitives | Refactor `input.tsx` focus/hover to tokens; consider non-mono default for general inputs.    |
| CALM-021 | Done   | Primitives | Refactor `select` + `dropdown-menu` popover chrome to shared shadow/border tokens.           |
| CALM-022 | Done   | Gallery    | Shared `GallerySearchField` (or extend `SearchBar`) for gallery + tier list search controls. |
| CALM-023 | Done   | Gallery    | Filter dialog icon header + option tiles: move glow to expressive tokens only.               |


### Epic F — Overlays, tooltips, sheets


| ID       | Status | Area       | Summary                                                                                                |
| -------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------ |
| CALM-024 | Done   | Primitives | `tooltip.tsx`: neutral shadow calm vs primary-tint expressive.                                         |
| CALM-025 | Done   | Primitives | `dialog.tsx`: title styling via typography roles; drop forced `font-display`+uppercase default.        |
| CALM-026 | Done   | Shell      | `draggable-drawer`, `auth-guard`, mobile sheets: tokenized border/shadow (not hardcoded primary glow). |


### Epic G — Globals and motion


| ID       | Status | Area    | Summary                                                                                                |
| -------- | ------ | ------- | ------------------------------------------------------------------------------------------------------ |
| CALM-027 | Done   | Globals | Scrollbar: calm neutral thumb; expressive optional gradient; wire via vars in `base.css`.              |
| CALM-028 | Done   | Globals | Gate `text-glow`, `border-glow`, `scanlines`, `holo-shimmer` for calm (or require explicit `data-fx`). |
| CALM-029 | Done   | Cards   | `CARD_GLOW`_* + `card-grid-item/image-stage` holo: calm outline-only path.                             |
| CALM-030 | Done   | Gallery | `CardGridItemFrame` gradient halo: chrome-aware via prop or CSS (single implementation for all tiles). |


### Epic H — Shell


| ID       | Status | Area    | Summary                                                                                   |
| -------- | ------ | ------- | ----------------------------------------------------------------------------------------- |
| CALM-031 | Done   | Shell   | Left-sidebar frame + right `icon-rail`: tokenize gradients and active-state glow.         |
| CALM-032 | Done   | Gallery | Active deck sidebar slot label: remove primary `drop-shadow` on calm (`slot-components`). |
| CALM-033 | Done   | Shell   | User menu avatar trigger: calm border without neon shadow (`auth-trigger`).               |


### Epic I — Pages and flows (feature migration)


| ID       | Status | Area      | Summary                                                                                                  |
| -------- | ------ | --------- | -------------------------------------------------------------------------------------------------------- |
| CALM-034 | Done   | Home      | Home `page.tsx`: `Surface` + calm CTA; reduce gradient hero chrome; preserve layout.                     |
| CALM-035 | Done   | Settings  | Settings `page.tsx`: flat `bg-background` on calm; optional gradient on expressive.                      |
| CALM-036 | Done   | Decks     | Decks view: heading pulse/blur → tokens; empty + auth-required CTAs per CALM-013.                        |
| CALM-037 | Done   | Decks     | Deck grid item + details panel: calm borders/shadows (`deck-grid-item`, `details-panel`).                |
| CALM-038 | Done   | Deck      | Deck details: loader, hero gradients, `deck-list-item` shadows.                                          |
| CALM-039 | Done   | Deck      | Card details dialog in deck flow: `card-details/dialog` buttons use button tokens.                       |
| CALM-040 | Done   | Gallery   | Gallery main: list items, loading, preview dialog align with Surface + frame policy.                     |
| CALM-041 | Done   | Cards     | Card details v2 + original: image halos, panels, keyword badges.                                         |
| CALM-042 | Done   | Community | Creator program hero: `SectionFx` wrapper or expressive-only (`border-glow`, `holo-shimmer`, text glow). |
| CALM-043 | Done   | Community | Media feed: `scanlines` only when expressive (`media-feed-section`).                                     |
| CALM-044 | Done   | Community | Tier lists: search (CALM-022) + badges + headings.                                                       |
| CALM-045 | Done   | Community | Community rankings: badges + headings (CALM-014–CALM-015 + typography).                                  |


### Epic J — QA, docs, cleanup


| ID       | Status | Area    | Summary                                                                               |
| -------- | ------ | ------- | ------------------------------------------------------------------------------------- |
| CALM-046 | Done   | QA      | UI matrix page or Storybook: primitives × calm vs expressive; screenshot baseline.    |
| CALM-047 | Done   | Hygiene | Post-migration: grep/CI allowlist for forbidden raw glow patterns in app directories. |
| CALM-048 | Done   | A11y    | Focus visibility and contrast without relying on glow (calm mode).                    |
| CALM-049 | Done   | Perf    | Document fewer blur layers on calm; optional follow-up metrics.                       |


## Priority band — community video feed (YouTube)

Goal (met 2026-04-16): **Community Feed** ([media-feed-section](../../src/components/community/sections/media-feed-section.tsx)) loads curated YouTube IDs from Convex, fetches metadata with YouTube Data API v3 (`videos.list` batching; no `search.list` on the default path), caches server-side, and surfaces thumbnails, titles, channel, duration, and views with compliance footer links.


| ID     | Status | Area       | Summary                                                                                                                                                                                                                                                     |
| ------ | ------ | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CF-001 | Done   | Infra      | **Done (2026-04-16):** Documented `YOUTUBE_DATA_API_KEY` for Convex deployments and where it is read (`convex/communityYoutube.ts`); operator checklist remains: create GCP project, enable YouTube Data API v3, restrict key, set var in Convex dashboard. |
| CF-002 | Done   | Data       | **Done (2026-04-16):** `communityYoutubeCurations` + default seed IDs (official/scene UniVersus-related public videos) with optional `label`, `accentClass`, `sortOrder`; `youtubeVideoMetadataCache` for API results.                                      |
| CF-003 | Done   | Backend    | **Done (2026-04-16):** Batched `videos.list` only (no `search.list` on default path); normalizes title, channel, ISO duration, views, thumbnails; `fetchedAt` + TTL-oriented refresh via cron + client-gated refresh.                                       |
| CF-004 | Done   | UI         | **Done (2026-04-16):** `CommunityMediaFeedSection` uses Convex `getFeed`; thumbnails, titles, channel, duration, views; outbound YouTube links; playbook-style folder `media-feed-section/`.                                                                |
| CF-005 | Done   | UX/QA      | **Done (2026-04-16):** Skeleton, empty, partial/error messaging; API key only in Convex actions (no `NEXT_PUBLIC`_*).                                                                                                                                       |
| CF-006 | Done   | Compliance | **Done (2026-04-16):** Section footer cites YouTube, API Services Terms, and How YouTube works; operator monitors quota in Google Cloud Console.                                                                                                            |


## Drag and Drop performance

**Goal:** Card drag-and-drop (`src/lib/dnd/`) should feel **immediate** (ghost tracks the pointer), **stable** (no flicker between targets), and **lightweight** (no whole-grid re-renders while hovering). Work top-down; verify gallery, active deck sidebar, deck details, and tier list lanes after each cluster.


| ID      | Status | Area    | Summary                                                                                                                                                                                                                                                                           |
| ------- | ------ | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DND-001 | Done   | Core    | **Drag ghost:** Drive overlay position with a ref + `requestAnimationFrame` (or direct `transform` on a DOM node) instead of `setState` on every `mousemove` / `touchmove` in `DragOverlay`.                                                                                      |
| DND-002 | Done   | Core    | **Ghost motion:** Remove `transition-transform` (or apply only on mount/teardown) on the floating card so the preview does not ease behind the cursor.                                                                                                                            |
| DND-003 | Done   | Core    | **Context churn:** Split or narrow `TcgDndContext` so `useTcgDraggable` consumers do not re-render when only `activeDropZone` changes (e.g. separate contexts, refs for actions, or `useSyncExternalStore`).                                                                      |
| DND-004 | Done   | Core    | **Hit testing:** During an active drag, resolve the drop target from pointer coordinates (`elementFromPoint` + zone registry, or `pointermove` with capture) instead of relying only on `mouseenter` / `mouseleave` between sibling zones.                                        |
| DND-005 | Done   | Hygiene | **Stable droppable deps:** Fix `useTcgDroppable` call sites that pass new `accepts` arrays or inline `onDrop` every render (`deck-details-cards-section-model`, `lane-row`); align with stable `TCG_DND_ACCEPTS_CARD_ONLY` + `useCallback` patterns used in active deck sections. |
| DND-006 | Done   | UX      | **Tier list lanes:** Replace or scope `transition-all` / scale-on-hover on droppable lanes so drag-hover feedback does not fight layout during rapid `activeDropZone` updates.                                                                                                    |
| DND-007 | Done   | Perf    | **Overlay asset:** Avoid decode jank on first drag (e.g. reuse an already-loaded image from the source tile, tiny cached preview, or `decode()` / placeholder) for the portal ghost.                                                                                              |
| DND-008 | Done   | QA      | **Done (2026-04-16):** [dnd-regression-checklist.md](../dnd-regression-checklist.md) — manual checklist for gallery → deck, sidebar reorder, deck details drops, tier list lanes + fast moves; optional `?dndDebug=1` / `tcg:dndDebug` per `tcg-dnd-provider`.                     |
| DND-009 | Done   | Shell   | **Mobile sheet drag:** Reduced `setDrawerHeight` churn during resize via rAF coalescing + imperative heights on ref’d nodes during drag; state reconciles on pointer up / cancel / settle (`MobileActionsDraggableDrawer` in `draggable-drawer.tsx`). Implemented 2026-04-16.     |


## App performance and optimization

**Goal:** After these items are **Done**, the app should feel **noticeably smoother and snappier**: gallery typing and filtering stay responsive, long lists stay light, initial JS is smaller where possible, and context/storage work does not fight the main thread. Order is suggested (data path and lists first); adjust if blocked.

**References:** Prior analysis in chat; Vercel React/Next perf guidance (defer non-urgent updates, shrink bundles, virtualize long lists, narrow context).


| ID       | Status | Area        | Summary                                                                                                                                                                                                                                                                                                                                                           |
| -------- | ------ | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERF-001 | Done   | Gallery     | **Deferred filter pipeline:** Use `useDeferredValue` (and/or `startTransition`) for gallery search + filter-driven list updates so the input stays instant while `filterCards` / `sortCards` runs off the urgent path; validate `GalleryFiltersProvider` + top-bar search.                                                                                        |
| PERF-002 | Done   | Catalog     | **Done (2026-04-16):** Single-pass client `filterCards` with precomputed zone/symbol inputs; format legality folded into that pass via optional `passesFormatLegality`; `sortCards` uses a stable comparator factory, 0/1-length fast paths, and a one-slot cache when the same filtered array + sort options repeat.                                             |
| PERF-003 | Done   | Gallery     | **Done (2026-04-16):** Main gallery grid/list/details use `@tanstack/react-virtual` + scroll-root ref; `useInfiniteSlice` removed from those views; catalog load-more unchanged (`LoadingProgress`).                                                                                                                                                              |
| PERF-004 | Done   | Gallery     | **Done (2026-04-16):** Single `CardDetailsDialog` in `GalleryMainContentBody` with `onOpenCardDetails`; grid/list/details virtualized rows no longer embed the dialog. `CardDetailsV2` is `React.lazy` + `Suspense` while `open` in `card-details/dialog.tsx`.                                                                                                    |
| PERF-005 | Done   | Motion      | **Done (2026-04-16):** Gallery/deck card tiles use CSS crossfade for flip (no `AnimatePresence` per tile); deck stacked grid removes motion stagger; app wrapped in `LazyMotion` + `domAnimation` with `m` from `framer-motion/m`; tier pool / settings / previews respect reduced motion.                                                                        |
| PERF-006 | Done   | Context     | **Done (2026-04-16):** Split `CardDataProvider` into `useCardReferenceData` (formats/sets) vs `useCardCatalog` (cards, index, filter helpers); `useCardData` merges both for compatibility. Documented in [card-data-hooks.md](../card-data-hooks.md).                                                                                                             |
| PERF-007 | Done   | Deck        | **Done (2026-04-16):** `ActiveDeckProvider` and `SiloedDeckProvider` resolve add/move eligibility via `useCardIndex().byId` instead of rebuilding a second full-catalog `Map` on each `cards` swap.                                                                                                                                                               |
| PERF-008 | Done   | Persistence | **Done (2026-04-16):** `persistUIState` is debounced then run via `requestIdleCallback` (with `setTimeout(0)` fallback); `visibilitychange` (hidden), `pagehide`, `beforeunload`, and provider unmount flush immediately so `localStorage` stays consistent (`src/providers/UIStateProvider.tsx`).                                                                |
| PERF-009 | Done   | Hooks       | **Done (2026-04-16):** `useIsMobile` uses `useSyncExternalStore` + `matchMedia` (`change`) so the client reads the breakpoint during render; gallery grid / infinite-scroll `rootMargin` no longer flip from a post-mount effect-only update.                                                                                                                     |
| PERF-010 | Done   | Auth        | **Done (2026-04-16):** `AuthGuard` shows the shell skeleton only while `useConvexAuth().isLoading` (or `requireAuth && !isAuthenticated` during redirect); removed `showContent` + 1s `setTimeout` that forced early content or delayed skeleton.                                                                                                                 |
| PERF-011 | Done   | Bundle      | **Done (2026-04-16):** `next/dynamic` + `RouteChunkFallback` for admin (dashboard, cards, sets, import, ui-matrix), tier-lists hub + `CommunityTierListDetailView` on `[tierListId]`, settings, collection; `ssr: true` (`src/components/shell/route-chunk-fallback.tsx`, co-located `*-page-client.tsx` where needed).                                           |
| PERF-012 | Done   | Bundle      | **Done (2026-04-16):** Replaced `@/lib/universus` and `@/components/universus` barrel imports with direct module paths across gallery, deck flows, providers, `universus` subtree, community tier-list card UI, and `useCardIdMap`.                                                                                                                               |
| PERF-013 | Done   | Images      | **Done (2026-04-16):** Image loading audit — `sizes` on card/deck thumbnails, hero, and hover previews; `priority` / lazy for first gallery grid row, list slice, deck grid slice, and deck-details sidebar grid slice; dual-face tiles and `CardDetailsV2` / legacy image panels no longer mark both faces `priority`; hover previews use `fetchPriority="low"`. |
| PERF-014 | Done   | Infra/API   | **Done (2026-04-16):** `api.cards.galleryIndexedSearchSpike` + `by_setCode_and_name` + `search_gallery_name`; migration notes in [gallery-server-search-spike.md](../gallery-server-search-spike.md).                                                                                                                                                              |
| PERF-015 | Done   | Hooks       | **Done (2026-04-16):** `useInfiniteSlice` keeps the latest `loadMore` in a ref; `IntersectionObserver` is created only when `rootMargin` changes, not when `loadMore` identity changes. `rootMargin` from render (e.g. tied to `useIsMobile` / PERF-009) still updates the observer when the breakpoint string changes.                                           |
