# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Added

- **Community YouTube channel watchlist** — Admins add creator channels on `/admin/content/youtube`; the two-hour cron (and admin/public refresh) pulls each channel’s newest uploads into the UniVersus Content stream, sorted by publish date. Per-channel title include/exclude words and an optional playlist keep mixed-game creators on-topic. Removing a synced video excludes it from later pulls.
  - **Files:** `convex/communityYoutubeChannels.ts`, `convex/communityYoutube.ts`, `convex/schema.ts`, `src/features/admin-youtube-curations/*`, `docs/SYSTEM_ANALYSIS.md`.

### Changed

- **Design system consistency** — Theme, chrome, and primitives now own color, casing, radius, and overlay styling so pages stop one-offing buttons, headings, and status chips.
  - **Decisions:** Casing comes from chrome tokens (`chrome-heading-case` / `chrome-label-case`), not inline `uppercase`. Status uses `--success` / `--warning` / `--info`. Dialogs share one scrim and content-size scale.
  - **Files:** `src/styles/base.css`, `src/components/ui/*`, `docs/UI_UX_DESIGN.md`, `docs/theme-and-chrome.md`.
- **Community hub drill-back** — `/community` is the overview; dest tabs (Tier Lists / Rankings / Creators) live only there. Drilled pages drop dest tabs and use an icon-only back to the hub. The tier-lists browser keeps Rankings / Public / My Lists as local tabs. Entity backs (deck detail, settings, list detail) stay icon-only with destination names for accessibility.
  - **Decisions:** Hub is not a dest sibling. Dest tabs do not persist on lists or creators. Do not show the word “Back” as visible label text. Title and Public / Global Ranked stay separate islands on list detail.
  - **Files:** `src/components/community/community-destination-tabs.tsx`, `src/components/community/community-view/floating-top-bar.tsx`, `src/components/community/tier-lists/page-view/floating-top-bar.tsx`, `src/app/(app)/community/creators/page.tsx`, `docs/floating-header-islands.md`.

### Fixed

- **Non-owner deck view** — Viewing someone else’s deck no longer shows add/remove or card-details section controls. Quantities stay visible; cards and the starting character still open full details.
  - **Files:** `src/components/deck-details/card-items/deck-card-stack-item/actions.tsx`, `src/components/deck-details/deck-details-hero-panel/static-image.tsx`, `src/components/universus/card-details/deck-section-controls.tsx`, `src/components/universus/card-details/variants/v2.tsx`.

- **Mobile card details scroll** — Gallery card details dialog on phone-width viewports scrolls through the stacked image and readout again. The recent floating-dialog pass left the column height-bounded with `overflow-hidden` and a `pointer-events-none` gutter, so nothing was a usable scrollport.
  - **Decisions:** Keep the overlay dismiss gutter. Make the mobile content column the scrollport (`overflow-y-auto`, `pointer-events-auto`) and stop overflow-hidden descendants from trapping the swipe. Desktop split is unchanged.
  - **Files:** `src/components/ui/dialog.tsx`, `src/components/universus/card-details/variants/v2.tsx`.

- **Mobile dialog click-through** — Closing a dialog (Gallery card details especially) no longer also taps the card, deck control, or chrome underneath.
  - **Decisions:** Swallow the leftover pointer/click after dismiss instead of changing the card-dialog layout or mobile `pointer-events-none` gutter.
  - **Files:** `src/components/ui/dialog.tsx`, `src/lib/suppress-subsequent-pointer.ts`.

- **Rankings in-content title** — Drop the desktop `Generated Community Tier List` / `Global Rankings` hero under the floating Rankings tabs; empty tiers stay readable.
  - **Context:** Issue #106.
  - **Decisions:** Rankings tab already provides context, so the heading is dropped rather than adding a floating identity pill.
  - **Files:** `src/components/community/community-rankings-view/content.tsx`.

- **Community destination tabs on tier-lists browser** — Desktop `/community/tier-lists` keeps Tier Lists / Rankings / Creators in the left header slot instead of replacing them with a Back pill.
  - **Context:** GitHub #53.
  - **Decisions:** Keep parent destination tabs visible (inventory + mobile dest nav). Nest Public / My Lists under Tier Lists only. Rankings stays a Community destination, not a duplicate nested tab. On the tier-lists bar, destination tabs are icon-only (names in `sr-only`) so they fit beside Public / My Lists in the left slot at 1440px. Hub feed remains via sidebar Community.
  - **Files:** `src/components/community/community-destination-tabs.tsx`, `src/components/community/community-view/floating-top-bar.tsx`, `src/components/community/tier-lists/page-view/floating-top-bar.tsx`, `docs/floating-header-islands.md`.

- **Teams landing page identity** — Desktop `/teams` (no team) now has a left identity pill `h1` (“Teams”); Create Team stays in the right action slot. Mobile keeps a matching `md:hidden` heading.
  - **Context:** Issue #102.
  - **Decisions:** Copy the teams-decks / settings title-pill pattern; do not add a desktop in-content PageHero.
  - **Files:** `src/components/teams/teams-landing-view.tsx`, `docs/floating-header-islands.md`.

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

