# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Fixed

- **Guest home Deck Builder copy** — Signed-out `/home` no longer promises create/edit on the Deck Builder card; `/decks` shows compact guest framing that building requires sign-in.
  - **Context:** GitHub #58 (duplicate #62).
  - **Decisions:** Keep OPEN → `/decks` public browse (option a) rather than opening auth immediately; signed-in card copy unchanged.
  - **Files:** `src/app/(app)/home/page.tsx`, `src/components/decks/decks-view/guest-browse-banner.tsx`, `src/components/decks/decks-view/content.tsx`, `src/components/decks/decks-view/heading.tsx`.

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

