# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Added

- **Collection in signed-in main nav** — Profile sheet (mobile) and left sidebar include Collection between Decks and Community, routing to `/collection`.
  - **Context:** Issue #64.
  - **Files:** `src/components/shell/main-nav-build.ts`.

- **Mobile header guest Sign In** — Persistent Sign In control in mobile top chrome for signed-out users.
  - **Context:** Issue #74 — guest `/gallery` lacked chrome-level Sign In; Profile sheet was the only discovery path.
  - **Decisions:** Mirror desktop left-sidebar guest Sign In in `MobileHeader` (compact accent outline); leave Profile Sign In as a secondary path; do not add Home to bottom nav.
  - **Files:** `src/components/shell/mobile-header.tsx`.

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

