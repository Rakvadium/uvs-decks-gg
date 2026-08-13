# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Fixed

- **Gallery cards-per-row is one preference** — Opening or closing the gallery sidebar no longer switches to a different remembered density.
  - **Context:** Issue #38. Silent dual `galleryCardsPerRowOpen` / `galleryCardsPerRowClosed` keys made the View Mode slider look like it reset.
  - **Decisions:** Single `galleryCardsPerRow` localStorage key; migrate preferring single → closed → open; drop dual keys on persist. No second hidden preference or width auto-fit.
  - **Files:** `src/providers/UIStateProvider.tsx`, `src/providers/GalleryFiltersProvider.tsx`, `src/lib/gallery/cards-per-row-preference.ts`, `tests/cards-per-row-preference.test.ts`.

### Added

- **Product tour sizzle reel** — Fullscreen interactive feature tour at `/tour` with auto-advancing beats, keyboard controls, and a Home “Watch Tour” entry.
  - **Context:** Request for a web sizzle reel to showcase product features.
  - **Decisions:** Standalone route outside the app shell (no floating header); CSS feature stages instead of live screenshots; respects `prefers-reduced-motion`.
  - **Files:** `src/app/tour/page.tsx`, `src/components/tour/sizzle-reel/*`, `src/app/(app)/home/page.tsx`.

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

