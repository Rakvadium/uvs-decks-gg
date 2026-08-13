# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Fixed

- **Community destination tabs on tier-lists browser** — Desktop `/community/tier-lists` keeps Tier Lists / Rankings / Creators in the left header slot instead of replacing them with a Back pill.
  - **Context:** GitHub #53.
  - **Decisions:** Keep parent destination tabs visible (inventory + mobile dest nav). Nest Public / My Lists under Tier Lists only. Rankings stays a Community destination, not a duplicate nested tab. Hub feed remains via sidebar Community.
  - **Files:** `src/components/community/community-destination-tabs.tsx`, `src/components/community/community-view/floating-top-bar.tsx`, `src/components/community/tier-lists/page-view/floating-top-bar.tsx`, `docs/floating-header-islands.md`.

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

