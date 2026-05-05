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


<a id="archived-backlog-active-2026-04-22"></a>

## Archived from BACKLOG.md — 2026-04-22 (CAT, RSC, TM, MC)

Moved here when clearing **Done** rows from the active [BACKLOG.md](../BACKLOG.md).


### Card catalog sync and Convex query hygiene

**Goal:** Keep the **local IndexedDB + in-memory filter** gallery model (fast UX at ~5k+ primary cards) while **minimizing sync bytes, round-trips, and full-table Convex reads**. Align bulk export with what the UI actually uses; eliminate or quarantine `collect()`-scale queries from hot paths (especially admin).

**References:** `src/lib/universus/use-universus-cards.ts` (`fetchFromConvex`, progress), `src/lib/universus/card-store.ts`, `convex/cards.ts` (`listReleasedPaginated`, `listAllCardsChunked`, `list`, `getRarities`, `getTypes`, `getSets`, `listCharacters`, `listReleased`), `src/app/(app)/admin/cards/cards-page-client.tsx`. Convex rules: indexed queries, pagination over `collect()` for large tables.


| ID      | Status | Area            | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ------ | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CAT-001 | Done   | Convex + client | **Bulk sync only gallery catalog rows:** Change the query used for full card cache sync (today `listReleasedPaginated` in `fetchFromConvex`) so each page returns only rows matching `isGalleryCatalogCard` / same rule as `filterCards` (`isFrontFace !== false`, `isVariant !== true`), mirroring `listAllCardsChunked` filtering. Remap `imageUrl` to public R2 URLs as today. **Acceptance:** fresh sync no longer stores backs/variants in IDB; gallery + deck resolution still find backs via `backCardId` / `getBackCard` as today; bump cache metadata or document one-time `clearCardCache` if old blobs incompatible.                                             |
| CAT-002 | Done   | Client          | **Tune sync chunk size and invocation count:** In `fetchFromConvex`, pick a `limit` (and document rationale) that balances **fewer `convex.query` round-trips** vs **payload size / browser parse cost** (try 1000 → measure; stay within Convex practical limits for `cardValidator` doc size). **Acceptance:** comment or small doc note with measured row count and approximate JSON size per chunk; no unnecessary extra loops.                                                                                                                                                                                                                                         |
| CAT-003 | Done   | Client          | **Accurate sync progress:** Replace `loadProgress` math that divides by hard-coded `3000` in `use-universus-cards.ts` with a real total — e.g. `serverVersionData.cardCount` from `getCardDataVersion`, or `totalEstimate` from an existing query (`listAllCardsChunked` / aligned API). **Acceptance:** progress reaches 100% when the last page is written; works when the catalog grows well past three thousand rows.                                                                                                                                                                                                                                                   |
| CAT-004 | Done   | Client          | **Remove fragile global `sortCards` cache:** The module-level `lastSortCache` in `use-universus-cards.ts` only tracks one sort and can confuse future callers. **Acceptance:** sorting relies on `useMemo` (e.g. `GalleryFiltersProvider` pipeline) or explicit memo at each call site; behavior and sort order unchanged; grep shows no stale reliance on global cache. **Done (2026-04-22):** `lastSortCache` removed; `sortCards` is pure; gallery pipeline and `useFilteredAndSortedCards` keep `useMemo` on filter+sort.                                                                                                                                               |
| CAT-005 | Done   | Client / perf   | **Optional spike — main-thread budget:** If profiling shows filter/sort jank with large catalogs, prototype **Web Worker** offload for `filterCards` + `sortCards`, or a **client search index** for name/text/all modes. **Acceptance:** spike doc in `docs/implementation/notes/` with verdict, bundle cost, and whether to merge; no merge required to close if spike says “not needed yet” with profiler evidence. **Done (2026-04-22):** `docs/implementation/notes/cat-005-main-thread-budget-spike.md` — methodology, **defer** (not needed yet), bundle estimate, **no merge** of worker in this pass.                                                              |
| CAT-006 | Done   | Infra           | **Optional — versioned static catalog:** Publish a **gzip JSON** (or similar) full catalog to R2/CDN keyed by `cardDataVersion`; client downloads blob when version changes; Convex holds version metadata only. **Acceptance:** design note (security, cache headers, fallback to Convex sync); implementation can be a follow-up row if split. **Done (2026-04-22):** `docs/implementation/notes/cat-006-versioned-static-catalog.md` — immutable URLs, integrity hash, CORS/same-origin options, cache headers, Convex paginated fallback matrix.                                                                                                                        |
| CAT-007 | Done   | Convex + admin  | **Eliminate hot full-table scans on `cards`:** `list` (empty search) and `listReleased` use bounded pagination; `getRarities` / `getTypes` / `getSets` use `cardFacetSnapshot` + `rebuildCardFacetSnapshot` on import/release/clear; `listCharacters` / `listPaginated` / `getCardVariants` bounded or indexed. Admin `cards-page-client` unchanged; server no longer `collect()`s on empty-search list. **Manual checklist:** [CAT-007-manual-checklist.md](../CAT-007-manual-checklist.md). **Done (2026-04-22).**                                                                                                                                                         |
| CAT-008 | Done   | Gallery / UX    | **Large `filteredCards` in context / dialog:** `GalleryFiltersProvider` and `CardDetailsDialog` hold the full filtered array for navigation. **Acceptance:** document peak memory tradeoff in `docs/card-data-hooks.md` (or sibling); if needed, implement **lazy navigation** (e.g. pass sorted filtered ids + `index.byId`, or cap dialog “nearby” slice) so pathological 10k+ result sets do not clone huge arrays into dialog props — scope behind measurement. **Done (2026-04-22):** `docs/card-data-hooks.md` — one shared `filteredCards` reference (no second array from dialog prop); catalog objects dominate; lazy nav deferred until heap profiling justifies. |


### Right sidebar & contextual shell performance

**Goal:** The desktop **right sidebar** (icon rail + expanded contextual panel for gallery deck/decks, etc.) should **open, close, and resize** without jank; **shell state** should not force unrelated routes to re-render; **gallery ↔ sidebar** interactions (including DnD) should not stack layout work. Work top-down: fix layout animation and context fan-out first, then DnD edge cases, then optional UX polish (resizable, preload).

**References:** Performance analysis 2026-04-16 — `RightSidebarExpandedPanel` (`m.div` width animation), `ShellSlotProvider` coarse context, `GalleryFiltersProvider` sidebar coupling, `TcgDndProvider` `activeDropZone` updates, `useRegisterSlot` effect deps; [shadcn Resizable](https://ui.shadcn.com/docs/components/radix/resizable) as optional follow-up.


| ID      | Status | Area       | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RSC-001 | Done   | Shell / UX | **Panel open/close without layout animation:** Replaced Framer `animate={{ width }}` on `RightSidebarExpandedPanel` with an instant `width` toggle and composited `x` transform for open (resize drag keeps zero-duration motion; `prefers-reduced-motion` skips slide). **Done (2026-04-22):** `src/components/shell/right-sidebar/expanded-panel.tsx`.                                                                                                                                                                                    |
| RSC-002 | Done   | Shell      | **Narrow `ShellSlot` subscriptions:** Split shell slot state into separate React contexts (`useShellSlotSlots`, `useShellSlotSidebarWidth`, `useShellSlotActiveSidebarActionId`, `useShellSlotActions`); `GalleryFiltersProvider` and layout/sidebar hooks subscribe only to the slices they need. **Done (2026-04-22):** `src/components/shell/shell-slot-provider/context.tsx`, `hook.ts`, `types.ts`; call sites in `GalleryFiltersProvider`, deck-details sidebar gallery, app layout, slot renderer, mobile shell, `useRegisterSlot`. |
| RSC-003 | Done   | Gallery    | **Decouple gallery density from sidebar toggle:** `GalleryFiltersProvider` applies open vs closed `cardsPerRow` from a 220ms delayed sidebar signal (0ms when `prefers-reduced-motion`) so column count updates after the panel slide, not with the main-column width toggle. **Done (2026-04-22):** `src/providers/GalleryFiltersProvider.tsx`.                                                                                                                                                                                           |
| RSC-004 | Done   | DnD        | **Stable drop-zone targeting at boundaries:** **Done (2026-04-22):** `TcgDndProvider` hit-test updates `resolvedDropTargetRef` every rAF for `endDrag` accuracy; `activeDropZone` context state commits only after **two** consecutive rAFs agree on the same zone, reducing `setState` churn at gallery/sidebar boundaries. **Files:** `src/lib/dnd/tcg-dnd-provider.tsx`.                                                                                                                                                                 |
| RSC-005 | Done   | DnD        | **Narrow droppable re-renders:** **Done (2026-04-22):** Committed `activeDropZone` lives in a module `useSyncExternalStore` source (no provider `setState` on hover); `useTcgDroppable` uses `useTcgDndActions` + `useTcgDndDragState` + `useTcgActiveDropZoneIsOver(id)` so only zones whose `isOver` boolean flips re-render. **Files:** `src/lib/dnd/tcg-dnd-provider.tsx`, `src/lib/dnd/use-tcg-droppable.ts`, `src/lib/dnd/index.ts`.                                                                                                  |
| RSC-006 | Done   | Shell      | **Stable slot registration:** Harden `useRegisterSlot` so `Component` (and similar) in the `useEffect` dependency list cannot thrash register/unregister when callers pass unstable references; prefer refs or explicit registration payloads. **Done (2026-04-22):** `useEffectEvent` + split layout effects — `src/components/shell/shell-slot-provider/use-register-slot.ts`.                                                                                                                                                             |
| RSC-007 | Done   | Shell / UX | **Evaluate resizable panel primitive:** Spike doc — keep custom `useRightSidebarResize` ([rsc-007-resizable-panels-spike.md](../implementation/notes/rsc-007-resizable-panels-spike.md)); **no merge** of shadcn / `react-resizable-panels` in this pass (layout/state integration cost; local throttle/pointer/split-context options if jank resurfaces). **Done (2026-04-22).**                                                                                                                                                            |
| RSC-008 | Done   | Bundle     | **Preload right sidebar chunk:** On routes that expose right-sidebar slots (gallery, deck details, admin), layout effect calls the same `import("@/components/shell")` loader as `next/dynamic` for `RightSidebar` so the first icon-rail open avoids extra dynamic-import latency. **Done (2026-04-22):** `src/app/(app)/layout.tsx`.                                                                                                                                                                                                     |


### Teams (workspace, decks, collaboration)

**Goal:** Users create teams, invite members, assign roles with **Convex-enforced capabilities**, share **team-visible** decks, and optionally co-edit **team-editable** decks with realtime presence. Team hub surfaces decks, members, stats, chat, announcements, and calendar.

**References:** [teams-feature-implementation.md](../teams-feature-implementation.md) · Auth patterns: `convex/utils/validation.ts`, `convex/decks.ts` · UI: [component-architecture-playbook.md](../component-architecture-playbook.md)


| ID     | Status | Area             | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------ | ------ | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TM-001 | Done   | Convex / schema  | **Teams core tables:** Add `teams`, `teamMembers`, `teamInvites` per spec §5.1–5.3 (indexes: slug, captain, member composite, token hash). Captain represented by `teams.captainUserId`; optional slug for `/teams/[slug]`. **Acceptance:** validators + migrations deploy; no UI required.                                                                                                                                                                                                                                                                         |
| TM-002 | Done   | Convex           | **Capabilities + team CRUD:** `convex/teams/permissions.ts` — matrix §4.2, `requireCapability` / `requireCaptain`, `create` / `updateSettings` / `dissolve`, `getTeam` / `listMyTeams`. Tests: `tests/teams-permissions.test.ts`. **Done (2026-04-22):** codegen `api["teams/permissions"]`.                                                                                                                                                                                                                                                                        |
| TM-003 | Done   | Convex + email   | **Invitations:** `convex/teams/invites.ts` — `createInvite` / `revokeInvite` / `acceptInvite`; `tokenHash` only in DB; co-captain+ via `invite_members`; accept matches email or `invitedUserId`; `/teams/invite/[token]`; email stub `docs/teams-invite-email-stub.md`. **Done (2026-04-22):** codegen `api.teams.invites`.                                                                                                                                                                                                                                        |
| TM-004 | Done   | Convex / schema  | **Deck visibility model:** Extend `decks` with `team` in deck visibility union, optional `teamId`, `teamCollaboration` (`none` \| `team_viewable` \| `team_editable`). See [teams-feature-implementation.md](../teams-feature-implementation.md) §5–7. **Done (2026-04-22).**                                                                                                                                                                                                                                                                                       |
| TM-005 | Done   | Convex           | **Deck authorization:** `requireDeckWriteAccess` + `canUserWriteDeck` in `convex/lib/deckAccess.ts` — team `team_viewable` owner-only writes; `team_editable` members with `create_team_deck` ( §7.3). `canViewDeck` accepts mutation ctx; `decks` mutations use write helper. `sessions.setActiveDeck` uses `canViewDeck`. Tests: `tests/deck-access-write.test.ts`. **Done (2026-04-22).**                                                                                                                                                                        |
| TM-006 | Done   | Next.js / UX     | **Team hub shell:** Routes `/teams` (list via `listMyTeams`) and `/teams/[teamId]` (Convex id; slug reserved for later). Layout + overview tab (name, description, placeholder logo). Desktop nav + mobile profile nav include **Teams** when `listMyTeams` is non-empty (`buildMainNavItems`). **Done (2026-04-22):** `api.teams.permissions` (`getTeam`, `listMyTeams`); feature folders `team-hub/*`, `teams-index/*`; `bun run build` pass.                                                                                                                     |
| TM-007 | Done   | Next.js + Convex | **Hub — members & decks:** Members table with roles; role edits (co-captain+). Decks tab listing `visibility=team` + `teamId` with filters for collaboration mode §6. **Acceptance:** actions gated by capabilities; empty states. **Done (2026-04-22):** `convex/teams/members` (`listForHub`, `updateMemberRole`), `convex/teams/teamDecks` (`listForHub`); routes `/teams/[teamId]/members`, `/teams/[teamId]/decks`; `team-hub` UI (`members-content`, `decks-content`, `shell-content`); `bun run build` pass.                                                 |
| TM-008 | Done   | Next.js + Convex | **Hub — announcements, chat, calendar:** Tables §5.4–5.6; paginated chat; CRUD with capability checks (define who can post events/pins). Stats tab placeholder or minimal aggregates if stats deferred. **Acceptance:** realtime subscriptions where specified; no unauthenticated reads. **Done (2026-04-22):** `teamAnnouncements` / `teamChatMessages` / `teamEvents` schema; `convex/teams/{hub,announcements,chat,events}.ts` + hub capabilities; routes `/teams/[teamId]/{announcements,chat,calendar,stats}`; `bun run build` pass.                          |
| TM-009 | Done   | Next.js          | **Discovery & navigation:** “My teams” list, team switcher or hub links, **Teams decks** view aggregating team-visible decks across user’s memberships §6. **Acceptance:** user sees only teams they belong to. **Done (2026-04-22):** `TeamsAreaNav` on `/teams` + `/teams/decks`; `convex/teams/teamDecks.listAggregatedForMyTeams` (`view_team_decks` per team, §6 collaboration filter); `src/components/teams/teams-decks/content.tsx` (team `Select` + table, hub links to each `/teams/[teamId]`); `bun run build` pass.                                     |
| TM-010 | Done   | Convex + client  | **Team-editable deck mutations:** Shared write path for `team_editable` §7.3; optimistic **`revision`** (or equivalent) on `decks` §8.3; client conflict handling / refetch. **Acceptance:** two users editing see consistent server state; owner-only path unchanged for `team_viewable`. **Done (2026-04-22):** `decks.revision`, card/layout mutations + `expectedRevision` / `CONFLICT` for `team_editable`; client providers + `useDeckEditor` conflict UX + import sequential apply.                                                                          |
| TM-011 | Done   | Convex + client  | **Collaboration presence:** `deckBuilderSessions` + `deckPresence` §5.8–5.9; `presenceHeartbeat` + `patchBuilderUiState`; subscribe in deck editor when `team_editable` §8; cursor overlay + shared `uiState` §8.1–8.2; stale `lastSeenAt` hidden client-side + cron prune; no presence for `team_viewable`. **Done (2026-04-22):** `convex/teams/deckCollaboration.ts`, schema tables, `DeckCollaborationProvider`, `bun run build` pass.                                                                                                                          |
| TM-012 | Done   | Next.js + Convex | **Team logo (moderated):** Captain/settings UI uploads via **MC-005–MC-006** pipeline; store approved asset id or URL on team; show placeholder while pending/rejected [content-moderation-and-language-filter.md](../content-moderation-and-language-filter.md) §3.6. **Acceptance:** rejected uploads never become public logo. **Done (2026-04-22):** `mediaAssets` + `teams.logoAssetId`, `api.mediaAssets` upload + `api.teams.logo.getTeamLogoPresentation`, stub moderation action (`MODERATION_STUB_VERDICT`), hub overview upload UX; `bun run build` pass. |


### Content safety — language filter & moderated media

**Goal:** **Profanity / language filter on by default** (toggle in settings); **extensible moderation** for team logos and future profile avatars via upload → pending → provider → approved/rejected.

**References:** [content-moderation-and-language-filter.md](../content-moderation-and-language-filter.md) · Settings: `src/app/(app)/settings/settings-page-client.tsx`, `convex/user.ts`


| ID     | Status | Area              | Summary                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------ | ------ | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MC-001 | Done   | Convex / schema   | **Preference field:** `users.profanityFilterEnabled` (optional `boolean`); **read as on when `undefined`** via `publicUserFromDocument` §1.2, §5. Exposed on `currentUser` / `getById` / `userValidator`. **Done (2026-04-22).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| MC-002 | Done   | Next.js + Convex  | **Settings toggle:** “Filter strong language…” in Settings; mutation updates preference; optimistic UI + toast. **Acceptance:** persists across sessions; copy matches chosen behavior (display vs publish — document in CHANGELOG). **Done (2026-04-22).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| MC-003 | Done   | Client            | **Filter integration:** `displayCommunityText` + `useProfanityDisplayText` (`src/lib/moderation/`) — default-on `profanityFilterEnabled !== false`; **others’** UGC masked with same-length block chars; **own** content unmasked. Wired: tier list feed/browser/detail title + description + lane labels (visitors), deck grid + gallery sidebar deck names + team deck tables, tier list comments section, team chat bodies. **Done (2026-04-22):** `bun run build` pass.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| MC-004 | Done   | Convex (optional) | **Publish-time text moderation:** `convex/lib/moderation/textPublish.ts`; `api.textModeration.publishGate`; `api.publishTierListComment.submitTierListComment`; `api.publishTeamChatMessage.submitTeamChatMessage`; `tierListCommentInternal` / `teamChatInsertInternal`; Perspective / Azure / OpenAI / `stub`; `TEXT_MODERATION_ON_FAILURE` `allow`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| MC-005 | Done   | Convex + storage  | **`mediaAssets` pipeline (TM-012 + verify):** `convex/schema.ts` — `mediaAssets` with `kind` `team_logo` \| `profile_avatar`, `status` including `pending`/`approved`/`rejected`/`needs_review`, indexes `by_status`, `by_teamId`, `by_teamId_and_kind`, `by_kind_and_status`. **Upload:** `api.mediaAssets.generateTeamLogoUploadUrl` (`ctx.storage.generateUploadUrl`) → client PUT → `submitTeamLogoUpload` inserts `pending`, schedules `internal.mediaAssetActions.runTeamLogoModeration` → `finalizeTeamLogoModeration` sets status and `teams.logoAssetId` only when `approved`. **Read path:** `api.teams.logo.getTeamLogoPresentation` returns `displayUrl` from storage only if linked asset is `approved` (see [content-moderation-and-language-filter.md](../content-moderation-and-language-filter.md) §3.2). **`profile_avatar`:** kind in schema; user-scoped upload mutations deferred until profile-avatar feature. **Acceptance:** no public image URL in query responses until `approved`. **Done (2026-04-22):** verification + docs; `bun run build` pass. |
| MC-006 | Done   | Convex actions    | **`runTeamLogoModeration` + image provider adapter ([content-moderation-and-language-filter.md](../content-moderation-and-language-filter.md) §3.4–3.5):** `getPendingTeamLogoAssetForModeration` → action reads blob via `ctx.storage.get` → `moderateImage` in `convex/lib/moderation/providers.ts` (`MODERATION_IMAGE_PROVIDER` `stub` \| `off` \| `sightengine`; stub: `MODERATION_STUB_VERDICT`; failure: `MODERATION_IMAGE_ON_FAILURE` `allow` \| `queue`; Sightengine: `SIGHTENGINE_API_USER`, `SIGHTENGINE_API_SECRET`, optional `MODERATION_IMAGE_REJECT_THRESHOLD`) → `finalizeTeamLogoModeration` persists `moderationProvider` + structured `moderationResult` for `approved` / `rejected` / `needs_review`. **Done (2026-04-22):** extends TM-012; `bun run build` pass. **Files:** `convex/mediaAssetActions.ts`, `convex/mediaAssets.ts`, `convex/lib/moderation/providers.ts`.                                                                                                                                                                                    |
| MC-007 | Done   | Next.js + admin   | **Review queue:** `/admin/moderation` + `listMediaAssetsNeedingReview` / `approveMediaAssetReview` / `rejectMediaAssetReview` — `reviewedAt`, `reviewerUserId` per [content-moderation-and-language-filter.md](../content-moderation-and-language-filter.md) §3.3; approve finalizes `team_logo` like `finalizeTeamLogoModeration`. **Done (2026-04-22).**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |


<a id="admin-area-epic-2026-04-22"></a>

## Admin area — sets, cards, formats, content, users (2026-04-22)

**Status:** All rows **IA-1** through **USR-14** in [../BACKLOG.md](../BACKLOG.md) are **Done** after orchestrated coding sub-agent passes (see [../orchestration/run-log.md](../orchestration/run-log.md) from 2026-04-22). **USR-8** (impersonation) closed as documentation-only per backlog “out of scope unless required.”

**Pointers:** [../CHANGELOG.md](../CHANGELOG.md) `[Unreleased]` for shipped bullets · [../user-account-status.md](../user-account-status.md) · [../admin-e2e-smoke.md](../admin-e2e-smoke.md) · [../admin-catalog-images-r2.md](../admin-catalog-images-r2.md) · implementation notes under `docs/implementation/notes/` (e.g. legality dates, REL-3 scoped release).
