# CAT-005 — Main-thread budget spike (filter / sort)

## Scope

Assess whether **offloading** `filterCards` and `sortCards` in `src/lib/universus/use-universus-cards.ts` to a **Web Worker**, or adding a **client search index** for name/text/all modes, is justified for current tcg-decks usage. Related backlog: [BACKLOG.md](../../BACKLOG.md) (row **CAT-005**).

## Methodology (how to verify jank)

1. **Environment:** Local `bun run dev`, gallery route, after a full catalog sync to IndexedDB (thousands of gallery-eligible cards per the [card catalog sync goal](../../BACKLOG.md)).
2. **Chrome DevTools → Performance:** Record 5–10 s while:
   - Typing in the gallery search field (rapid characters),
   - Toggling facet filters and sort,
   - Scrolling the virtualized grid (slice already limits rendered rows; scroll stress-tests layout + virtualizer, not the full filter list).
3. **Interpretation:** In the main-thread flame chart, flag **long tasks** generally above **~50 ms** (one frame at 60 Hz) during search/filter *after* input settles, and note whether input feels laggy vs. the intentionally “trailing” deferred list update (`useDeferredValue` behavior).
4. **Optional:** Enable **“Screenshots”** and **“Web vitals”** in the same recording; **Lighthouse** performance pass on `/gallery` is a coarse secondary signal, not a substitute for step 2.
5. **This spike (2026-04-22):** No dedicated capture was archived in CI. The verdict below combines the methodology above (for future re-checks) with **code-path review** and **documented prior work** (PERF-001 / PERF-002 in [CHANGELOG.md](../../CHANGELOG.md)): the gallery pipeline already defers filter/sort inputs and uses a **single-pass** `filterCards` and optimized `sortCards`.

## What the app does today (relevant to main thread)

- **Input responsiveness:** `src/providers/GalleryFiltersProvider.tsx` applies `useDeferredValue` to search, search mode, persisted filters, and sort so **keystrokes stay on the fast path** while `filteredCards` catches up.
- **Work per pipeline run:** `filterCards` is one `for` loop with early `continue`s (PERF-002). `sortCards` uses a comparator factory and skips sorting for 0–1 items. Cost scales **O(n)** in catalog size and **O(k log k)** in matches for `k` = filtered length.
- **Downstream UI:** The main content uses an **infinite slice** of `meta.filteredCards` for the grid/list/details views, not rendering the entire filtered array at once.
- **Alternatives in flight:** PERF-014 (server-assisted gallery search; see [CHANGELOG.md](../../CHANGELOG.md)) may reduce *local* “search the text on every card” load for some modes; [CAT-006](../../BACKLOG.md#card-catalog-sync-and-convex-query-hygiene) (versioned static catalog) is a different axis (bytes / sync), not a substitute for this spike’s worker question unless combined with a different search strategy.

## Verdict

**Not needed yet — defer** worker/index work until either:

- Profiling in the field shows **sustained long tasks** on filter/sort at target catalog sizes, or  
- The catalog or filter surface grows materially (e.g. **much larger** than the low-thousands gallery-eligible rows the product targets today), or  
- **User-reported** input jank that `useDeferredValue` cannot mask.

Rationale: existing **defer + memo + single-pass filter + slice** already address the usual main-thread issues for this workload; moving the same O(n) work off-thread adds **complexity and transfer costs** without a measured problem today.

## Bundle cost estimate (if we implemented a worker)

Rough order of magnitude for a **minimal** `new Worker(new URL("…", import.meta.url))` path that duplicates or imports filter/sort logic into the worker chunk:

| Item | Order of magnitude |
| --- | --- |
| Extra **compressed** JS chunk (worker entry + `filterCards` / `sortCards` and types they need) | **~8–25 kB** gzip (depends on how much of `CachedCard` / helpers is tree-shaken or duplicated) |
| Optional thin helper (e.g. comlink) | **~1–2 kB** gzip if added; many teams use **postMessage** only for a single job type |
| **Runtime cost:** `postMessage` of **large arrays** of full card objects can **dominate** and erase wins unless the protocol sends **ids** and the worker uses a **SharedArrayBuffer**-like strategy (not default on the open web) or a compact representation — so bundle size is *not* the only constraint. |

A **client text index** (e.g. per-field tokenization) is mostly **CPU + memory** in the main thread for index build; it might *increase* JS heap before it helps jank, unless search becomes the only hot path and index size is bounded.

**Verdict on merge:** **Do not merge** a worker or search-index implementation in this pass; re-open when measurement justifies it.

## When to re-spike

- After PERF-014 or other server search changes land: re-run the Performance steps above; server may shrink local search work.  
- If [CAT-008](../../BACKLOG.md#card-catalog-sync-and-convex-query-hygiene) (large `filteredCards` in context) is addressed with **id-only** navigation, a worker that filters **ids** and returns an **id list** may become more attractive.  
- Any regression report on gallery **typing** or **filter** latency on mid-tier mobile hardware.
