# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Added

- **DND-008 — DnD regression checklist** — [dnd-regression-checklist.md](./dnd-regression-checklist.md) for manual verification (gallery → main/side/reference, sidebar reorder, deck details drops, tier list lanes and fast pointer moves); optional `?dndDebug=1` / localStorage `tcg:dndDebug`; [smoke-checklist.md](./smoke-checklist.md) links to it.
  - **Context:** Backlog DND-008.
  - **Files:** `docs/dnd-regression-checklist.md`, `docs/smoke-checklist.md`.
- **CF-001–CF-006 — Community YouTube feed** — Convex-backed curated video IDs, server-only YouTube Data API v3 `videos.list` fetch with batched IDs, cached metadata (`fetchedAt`, six-hour TTL target, two-hour cron refresh), and `CommunityMediaFeedSection` wired to `getFeed` with loading/empty/degraded states and YouTube API attribution footer. Env: `YOUTUBE_DATA_API_KEY` in Convex (documented in [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)).
  - **Context:** Backlogs CF-001 through CF-006.
  - **Files:** `convex/schema.ts`, `convex/communityYoutube.ts`, `convex/crons.ts`, `src/components/community/sections/media-feed-section/`, `next.config.ts`, `docs/SYSTEM_ANALYSIS.md`.
- **Community YouTube feed — embedded player** — Main column plays videos via YouTube iframe embed; queue thumbnails select the active clip (single player, ring highlight); Open on YouTube links kept for external viewing; error state skips embed with fallback CTA.
  - **Files:** `src/components/community/sections/media-feed-section/content.tsx`, `src/components/community/sections/media-feed-section/youtube-embed.tsx`.
- Documentation hub under `docs/` mirroring the `_reference/docs` structure: product vision, system analysis, architecture plan, backlog, changelog, agent workflows, code size policy, and orchestration references; integrated [component-architecture-playbook.md](./component-architecture-playbook.md) as the primary UI structure guide.
- **CALM-001 — `data-chrome` on document root** — Maps each color scheme to `calm` or `expressive` in `ColorSchemeProvider` alongside existing `data-color-scheme` behavior.
  - **Context:** Backlog CALM-001.
  - **Files:** `src/providers/ColorSchemeProvider.tsx`.
- **CALM-002 — Theme and chrome doc** — [theme-and-chrome.md](./theme-and-chrome.md) centralizes scheme→chrome rules and how to add schemes.
  - **Context:** Backlog CALM-002.
- **P-001 — System analysis refresh** — SYSTEM_ANALYSIS documents theme attributes and playbook-style feature folders; links theme/smoke docs.
  - **Context:** Backlog P-001.
- **P-002 — Smoke checklist** — [smoke-checklist.md](./smoke-checklist.md) lists `bun run build`, `bun run lint`, and manual critical routes.
  - **Context:** Backlog P-002.
- **CALM-003 — Chrome CSS layers** — `chrome-calm` / `chrome-expressive` layers in `src/styles/base.css` with semantic `--chrome-`* variables; scrollbar uses those tokens.
  - **Context:** Backlog CALM-003.
  - **Files:** `src/styles/base.css`, `docs/theme-and-chrome.md`.
- **CALM-004 — Session chrome preference** — Convex `sessions.chromePreference`, provider resolution + context setters, Settings control (Auto / Calm / Expressive).
  - **Context:** Backlog CALM-004.
  - **Files:** `convex/schema.ts`, `convex/validators.ts`, `convex/sessions.ts`, `src/providers/ColorSchemeProvider.tsx`, `src/lib/theme.ts`, `src/app/(app)/settings/page.tsx`, `docs/theme-and-chrome.md`.
- **CALM-005 — New-user theme defaults** — Documented: client fallbacks use holoterminal + dark theme + `chromePreference` auto until a session row exists; no onboarding change required for this pass.
  - **Context:** Backlog CALM-005.
  - **Files:** `docs/theme-and-chrome.md`.
- **CALM-006 — Typography primitives** — `PageHeading`, `SectionHeading`, `Kicker` in `src/components/ui/typography-headings.tsx` using chrome heading CSS variables.
  - **Context:** Backlog CALM-006.
- **CALM-007 — Shell headings** — Brand, mobile header, nav admin label, expanded panel title, mobile slot grid labels use typography primitives.
  - **Context:** Backlog CALM-007.
- **CALM-008 — Gallery headings** — Stats, empty state, loading strings, filter dialog header use typography primitives.
  - **Context:** Backlog CALM-008.
- **CALM-009 — Decks / deck details headings** — Deck database heading, grid meta titles, details meta/top bar, stack/list group labels use typography primitives.
  - **Context:** Backlog CALM-009.
- **CALM-010 — Community headings** — Shared section header, rankings, tier list UI, media feed, creator program, labs/toolkit sections use typography primitives.
  - **Context:** Backlog CALM-010.
- **CALM-011 — Card details titles** — Modern and original `CardDetailsTitleSection` plus v2 layout card name use `SectionHeading`; screen-reader `DialogTitle` unchanged.
  - **Context:** Backlog CALM-011.
- **R-001 — Large component inventory** — [orchestration/large-component-inventory.md](./orchestration/large-component-inventory.md) lists largest App Router pages and heavy dialogs for playbook-sized splits.
  - **Context:** Backlog R-001.
- **CALM-012 — Button chrome shadows** — Button variants use `--chrome-button-shadow-`* tokens in `base.css`; calm uses neutral elevation, expressive keeps glow.
  - **Context:** Backlog CALM-012.
- **CALM-013 — Calm CTA policy** — Replaced `Button variant="neon"` with `default`/`outline` on decks auth/empty, deck-details empty, gallery sidebar empty, home (not creator program).
  - **Context:** Backlog CALM-013.
- **CALM-014–016 — Badge tones** — `Badge` gains `tone` API + `--chrome-badge-`* tokens; migrated cyber→entity and neon→signal across app.
  - **Context:** Backlogs CALM-014, CALM-015, CALM-016.
- **CALM-017–018 — Card / Surface** — `Card variant="fx"|"quiet"`, `Surface` alias, tokenized shadows; `CardTitle`/`CardDescription` use chrome typography vars.
  - **Context:** Backlogs CALM-017, CALM-018.
- **CALM-019 — Community hub sections** — `community-view/content.tsx` uses `Surface` + chrome elevation instead of hardcoded heavy shadows.
  - **Context:** Backlog CALM-019.
- **CALM-020 — Input focus** — `Input` uses `--chrome-focus-`* tokens; default typography is sans.
  - **Context:** Backlog CALM-020.
- **CALM-021 — Popover tokens** — `Select` + `DropdownMenu` content use `--chrome-popover-shadow` / `--chrome-popover-border`.
  - **Context:** Backlog CALM-021.
- **CALM-022 — GallerySearchField** — Shared `GallerySearchField` + `--chrome-search-field-`*; gallery top bar + tier lists top bar.
  - **Context:** Backlog CALM-022.
- **CALM-023 — Filter dialog tiles** — `--chrome-filter-`* tokens; header icon well + selected filter tiles calm vs expressive.
  - **Context:** Backlog CALM-023.
- **CALM-024–026 — Overlays / sheets** — Tooltip + dialog title chrome vars; draggable drawer + auth-guard use `--chrome-sheet-`*.
  - **Context:** Backlogs CALM-024, CALM-025, CALM-026.
- **CALM-027–030 — Globals + card frame** — Scrollbar hover/solid tokens; FX utilities gated by `data-chrome` / `data-fx`; card image + frame glow CSS vars.
  - **Context:** Backlogs CALM-027–CALM-030.
- **CALM-044–045 — Community follow-ups** — Marked done: tier list shared search + prior headings/badges work satisfies scope.
  - **Context:** Backlogs CALM-044, CALM-045.
- **CALM-031–033 — Shell chrome** — `--chrome-shell-`* for sidebar wash, nav/rail active states, brand, deck slot label, avatar ring.
  - **Context:** Backlogs CALM-031–CALM-033.
- **CALM-034–037 — Home / settings / decks** — Page background + hero wash vars; decks heading + grid chrome tokens.
  - **Context:** Backlogs CALM-034–CALM-037.
- **CALM-038–043 — Remaining flows** — `useChromeMode()` on context; card-details original polish; media/creator FX gating verified; deck/gallery tokens consolidated per sub-agent report.
  - **Context:** Backlogs CALM-038–CALM-043.
- **CALM-047–049 — QA docs** — [glow-regression-checklist.md](./orchestration/glow-regression-checklist.md), [calm-a11y-perf-notes.md](./orchestration/calm-a11y-perf-notes.md).
  - **Context:** Backlogs CALM-047–CALM-049.
- **CALM-046 — UI matrix** — Admin route `/admin/ui-matrix` for Button / Badge / Card chrome sampling.
  - **Context:** Backlog CALM-046.

- **CAT-001 — Bulk sync gallery-only rows** — `listReleasedPaginated` now filters through `isGalleryCatalogCard` before R2 URL remap; backs/variants excluded from IDB sync.
  - **Context:** Backlog CAT-001.
  - **Files:** `convex/cards.ts`.
- **CAT-002 — Sync chunk size rationale** — Documented `limit: 1000` tradeoff (~5 round-trips, ~700KB/chunk).
  - **Context:** Backlog CAT-002.
  - **Files:** `docs/implementation/notes/sync-chunk-size.md`.
- **CAT-003 — Accurate sync progress** — Replaced hard-coded 3000 divisor with `serverVersionData?.cardCount` for real progress tracking.
  - **Context:** Backlog CAT-003.
  - **Files:** `src/lib/universus/use-universus-cards.ts`.
- **CAT-004 — Remove global sortCards cache** — Removed module-level `lastSortCache`; all call sites already `useMemo`-wrapped.
  - **Context:** Backlog CAT-004.
  - **Files:** `src/lib/universus/use-universus-cards.ts`.
- **CAT-005 — Filter/sort spike** — Spike verdict: "not needed yet" — filter <5ms, sort <15ms at 3.5k cards.
  - **Context:** Backlog CAT-005.
  - **Files:** `docs/implementation/notes/filter-sort-spike.md`.
- **CAT-006 — Versioned static catalog spike** — Design note: "defer" — R2 static catalog marginal at current scale.
  - **Context:** Backlog CAT-006.
  - **Files:** `docs/implementation/notes/versioned-static-catalog.md`.
- **CAT-007 — Eliminate hot full-table scans** — Removed `.collect()` from `list`, `getRarities`, `getTypes`, `getSets`, `listCharacters`; removed unused `listReleased`; index-walk for facet queries; admin list bounded with `.take()`.
  - **Context:** Backlog CAT-007.
  - **Files:** `convex/cards.ts`, `src/app/(app)/admin/cards/cards-page-client.tsx`.
- **CAT-008 — filteredCards memory analysis** — Documented peak memory tradeoff; dialog uses ref (zero clone cost); lazy nav not needed at current scale.
  - **Context:** Backlog CAT-008.
  - **Files:** `docs/card-data-hooks.md`.
- **RSC-001 — Panel open/close without layout animation** — Replaced Framer `animate={{ width }}` with instant toggle + opacity CSS transition.
  - **Context:** Backlog RSC-001.
  - **Files:** `src/components/shell/right-sidebar/expanded-panel.tsx`.
- **RSC-002 — Narrow ShellSlot subscriptions** — Split into 3 contexts (actions/activeSidebar/slotData); narrow hooks per consumer.
  - **Context:** Backlog RSC-002.
  - **Files:** `src/components/shell/shell-slot-provider/context.tsx`, `hook.ts`, `use-register-slot.ts`, `slot-renderer.tsx`, consumers.
- **RSC-003 — Decouple gallery density from sidebar** — `useDeferredValue(isSidebarOpen)` defers `cardsPerRow` change from sidebar toggle.
  - **Context:** Backlog RSC-003.
  - **Files:** `src/providers/GalleryFiltersProvider.tsx`.
- **RSC-004 — Stable drop-zone targeting** — 2-frame consecutive agreement before committing `activeDropZone` changes; eliminates rapid zone flipping.
  - **Context:** Backlog RSC-004.
  - **Files:** `src/lib/dnd/tcg-dnd-provider.tsx`.
- **RSC-005 — Narrow droppable re-renders** — `useSyncExternalStore`-backed activeDropZone store; per-zone `isOver` selector; only affected zones re-render.
  - **Context:** Backlog RSC-005.
  - **Files:** `src/lib/dnd/tcg-dnd-provider.tsx`, `src/lib/dnd/use-tcg-droppable.ts`.
- **RSC-006 — Stable slot registration** — Stable wrapper component via ref in `useRegisterSlot`; `Component`/`options` out of effect deps.
  - **Context:** Backlog RSC-006.
  - **Files:** `src/components/shell/shell-slot-provider/use-register-slot.ts`.
- **RSC-007 — Resizable panel spike** — "Keep current" — `react-resizable-panels` adds bundle cost without simplification.
  - **Context:** Backlog RSC-007.
  - **Files:** `docs/implementation/notes/resizable-panel-spike.md`.
- **RSC-008 — Preload right sidebar chunk** — Mount-time `import("@/components/shell")` preload; sidebar chunk cached before first icon-rail click.
  - **Context:** Backlog RSC-008.
  - **Files:** `src/app/(app)/layout.tsx`.

### Changed

- **PERF-012 — Direct imports (universus barrels)** — Gallery, deck, provider, home, community card surfaces, and `universus` internals import `card-data-provider`, `use-universus-cards`, `card-store`, `card-details/*`, and `card-grid-item` directly instead of `@/lib/universus` and `@/components/universus` index re-exports, trimming webpack re-export graphs on hot paths.
  - **Context:** Backlog PERF-012.
  - **Files:** Broad `src/components/gallery/`, `src/components/deck*/`, `src/providers/`, `src/app/providers.tsx`, `src/lib/deck/siloed-deck-context.tsx`, `src/components/universus/`, `src/components/community/**/tier-lists/`**, `src/hooks/useCardIdMap.ts`, and related.
- **PERF-015 — Stable infinite scroll observer** — `useInfiniteSlice` stores the latest `loadMore` in a ref and wires `IntersectionObserver` in an effect that depends only on `rootMargin`, so parent re-renders that replace the callback (e.g. `hasMore` / closure churn) no longer disconnect/reconnect the observer. Callers that derive `rootMargin` from `useIsMobile` still recreate the observer when the breakpoint-driven margin string changes, matching PERF-009’s sync `matchMedia` updates.
  - **Context:** Backlog PERF-015.
  - **Files:** `src/hooks/useInfiniteSlice.ts`.
- **PERF-009 — Stable mobile breakpoint** — `useIsMobile` subscribes to `window.matchMedia` via `useSyncExternalStore` so the viewport breakpoint is read during render and updates on `change` events, avoiding the previous `useState(false)` + `useEffect` flip after mount (gallery grid columns and observer `rootMargin` stay consistent with Tailwind `md` at 768px).
  - **Context:** Backlog PERF-009.
  - **Files:** `src/hooks/useIsMobile.ts`.
- **PERF-003 — Gallery virtualization** — Main gallery grid, list, and details views use `@tanstack/react-virtual` against the main `overflow-y-auto` scroller (via `GalleryMainScrollRootProvider`); only visible rows/cells mount. Replaced `useInfiniteSlice` + bottom sentinel on those routes; incremental catalog loading remains `LoadingProgress` / `meta.isLoadingMore`.
  - **Context:** Backlog PERF-003.
  - **Files:** `package.json`, `src/components/gallery/main-content/content.tsx`, `gallery-main-scroll-root.tsx`, `grid-view.tsx`, `list-view.tsx`, `details-view.tsx`; removed unused `src/components/gallery/main-content/constants.ts`.

---

## Entry template (for agents)

Copy and fill when you complete work:

```markdown
### Changed (or Added / Fixed / Removed)

- **Short title** — One-line summary.
  - **Context:** Backlog id / issue / request.
  - **Decisions:** Trade-offs worth remembering.
  - **Files:** Notable paths.
  - **Follow-ups:** Optional.
```

