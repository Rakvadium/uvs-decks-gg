# Changelog — tcg-decks

All notable changes to this project are recorded here.

## How to use this file

- Under `**[Unreleased]**`, add bullets or subsections for each task or PR-sized chunk of work (what changed, why, notable paths, follow-ups).
- When cutting a release, move content from `[Unreleased]` into a dated section: `## [x.y.z] - YYYY-MM-DD`.
- Tie entries to backlog IDs in [BACKLOG.md](./BACKLOG.md) when applicable.

## [Unreleased]

### Added

- **USR-1 – USR-14 — User admin, account status, enforcement, and audit (USR-8 doc-only)** — `users` schema: `accountStatus` (`active` \| `suspended` \| `banned` \| `write_restricted`), `statusReason`, `statusSetAt`, `statusSetBy`, `statusExpiresAt`, `userFacingMessage`, `adminSearchText`, `hasVerifiedEmail`; indexes and `search_admin_users` for the admin directory. `tierLists.listModerationStatus` (pending/approved/rejected) + `by_userId_and_listModerationStatus`. `teamChatMessages.by_authorUserId`. Append-only `moderationAuditLog` with `by_targetUser` / `by_actor`. **API** (`convex/adminUsers.ts`): `listDirectory` (search + filters + paginate), `getUserAdminDetail` (including capped counts, pending tier list ids), `listModerationAudit`, `setAccountStatus`, `setUserRole`, `bulkSetTierListListModeration`, `runUserDirectoryBackfillBatch`. **Policy:** sole-admin cannot be demoted or fully restricted; no self status change via `setAccountStatus`; `setUserRole` and status mutations append audit rows. **Enforcement:** `requireUserCanPostContent` / `requireUserCanUpdateProfile` / stricter `requireAdmin`; `convex/lib/accountStatus.ts`, lazy expiry in mutations, `accountStatusExpiry.runExpireStaleStatuses` on a 5-minute cron. Wired into decks, deck access, tier lists, comments (internal + publish action), team chat, collections, social, deck shares, and `user` profile mutations. **UI:** `admin-users-page-client.tsx` (directory, CSV of current result page, backfill control), `admin-user-detail-page-client.tsx` (`/admin/users/[userId]`), `AccountStatusBanner` (user-facing only; not internal `statusReason`). **Docs:** [user-account-status.md](./user-account-status.md) (policy, Clerk/session note, USR-14, USR-6 `write_restricted`, **USR-8 impersonation explicitly out of scope**). **Context:** USR-1, USR-2, USR-3, USR-4, USR-5, USR-6, USR-7, USR-9, USR-10, USR-11, USR-12, USR-13, USR-14; **USR-8** documented only.


- **IMP-1, IMP-2, IMP-3, QX-1, QX-2, QX-3, QX-4 — Admin import UX, ingestion visibility, and QA** — `/admin/import` forwards to `/admin/sets?deprecatedGlobalImport=1` with a dismissible notice on the Sets list; `?legacy=1` shows a legacy helper to open set-scoped import. **`adminAuditLog`** table and `logAdminAudit` record `clearAllCards`; clear-all is behind Advanced + `AlertDialog` with type-to-confirm (`DELETE ALL CARDS`). **`listMyRecentIngestionJobs`**; **`getIngestionJob`** requires admin and returns the job only for its owner. **`IngestionJobsPanel`** on set import and admin dashboard; set import and cards: skeleton/empty/retry, Convex errors → Sonner toasts on key flows; `aria-live` for set release + catalog publish; table **focus rings** and horizontal scroll for wide admin tables; [admin-e2e-smoke.md](./admin-e2e-smoke.md) manual checklist. **Context:** Backlog IMP-1 – IMP-3, QX-1 – QX-4.
- **CNT-1 – CNT-4 — Community YouTube curation (Convex + admin)** — Admin API in `convex/communityYoutube.ts` (`listYoutubeCurationsForAdmin` with `requireAdmin`, `addYoutubeCuration` with shared URL/id parsing, `updateYoutubeCuration` for label/accent/sortOrder, `deleteYoutubeCuration`, `reorderYoutubeCurations`); list is an admin-gated **query**; mutations are `requireAdmin`. Public community page uses `getFeed` (curated `youtubeVideoId` + metadata, no internal curation id); metadata cache and two-hour `cronRefreshFeed` + client refresh unchanged. `ensureDefaultCurations` (cron/bootstrap/refresh) never alters or replaces existing curation rows: with `communityYoutubeCurationInitState` set, it no-ops; with **any** curation present but init missing, it only records init; only when the table is **empty** and init is missing does it insert each default if no row for that `youtubeVideoId` (idempotent, no overwrites of manual label/accent from deploy). `shared/extract-youtube-video-id.ts` is shared with Convex. **UI:** `src/features/admin-youtube-curations/` on `/admin/content/youtube` — @dnd-kit reorder, inline label/accent, `Image` preview, server + **client** duplicate id checks, stable row `key` by `curationId`, `requestClientRefresh` for metadata. **Context:** CNT-1 – CNT-4.
- **LEG-1 – LEG-6 — Format legality admin and Convex API** — Composite indexes `cardLegality.by_format_card` and `setLegality.by_format_set`. Admin API: `listSetLegalityByFormat`, `listCardLegalityByFormat`, `listCardLegalityByFormatEnriched`, `searchCardsForLegalityAdmin`, `exportFormatLegalityBundle`, `upsertSetLegality`, `upsertCardLegality`, `bulkUpsertCardLegality`, `importFormatLegalityBundle`. Deck validation applies `cardLegality.effectiveDate` (future = not enforced yet). **UI:** `src/features/admin-format-legality/` — `/admin/formats/[key]` tabs (settings, set matrix, card search + overrides + filters, JSON backup/restore). Set cards table **Legality** dropdown deep-links to the card tab with `focusCard`. **Docs:** `docs/implementation/notes/legality-dates.md`, `SYSTEM_ANALYSIS.md` deck-build bullet.
- **FMT-1 – FMT-3 — Admin formats CRUD** — **List** (`src/app/(app)/admin/formats/formats-page-client.tsx`): table from `api.formats.list` with min/max, sideboard rule, copy limit, default badge, sort (default first then name), empty state, “New format” to `/admin/formats/new`, row links to `/admin/formats/[key]`. **Create** (`/admin/formats/new`, `api.admin.createFormat`) and **edit** (`[key]`, `api.admin.updateFormat`) via `src/features/admin-format/format-form-content.tsx` (key, name, description, default switch with single-default behavior, deck limits, sideboard rule, sub-formats). `updateFormat` ensures another default when unsetting the only default. **Delete** — `api.admin.getFormatDeleteBlockers`, `api.admin.deleteFormat` block when `cardLegality`, `setLegality`, or `decks` reference the format key; `FormatDeleteSection` uses confirm dialog. **Schema** — `decks` index `by_format` for dependency checks. **Context:** Backlog FMT-1 – FMT-3.
- **REL-1 — Honest “unreleased” catalog changes (Convex)** — `cards.contentRevisionAt` (optional) set on admin create/update, batch import, seed/import helpers, face linking, and stat migration patches. `api.admin.listUnreleasedCards` now takes optional `setCode` and returns cards whose effective revision time (`contentRevisionAt` or `_creationTime`) is **after** `cardDataVersion.updatedAt`, plus metadata (`lastCatalogReleaseAt`, `publishedCatalogVersion`, `truncated`, `noPublishedCatalogYet`). Empty result when no publish record exists yet. `cardValidator` aligned with schema (`number`, `legality`, `contentRevisionAt`). **REL-3** deferred: [rel-3-scoped-catalog-release.md](./implementation/notes/rel-3-scoped-catalog-release.md).
- **REL-2 — Admin publish catalog UX** — `CatalogReleaseDialog` (`src/components/admin/catalog-release-dialog.tsx`): current version, gallery-eligible `cardCount`, last publish time, confirm dialog, `releaseCards`, Sonner toast with new version. Wired from set cards toolbar, admin dashboard **Published catalog** card, and set overview hub. **Context:** REL-1, REL-2, REL-3 note.
- **CRD-1 – CRD-9 — Admin set cards and bulk import** — `api.admin.listCardsBySetCode` (indexed by `by_setCode_and_name`), `getCardDeleteWarnings`, `previewBulkImportCards`, `ensureAdminForAction`; `createCard` / `updateCard` derive `searchText` / `searchAll`; `bulkImportCards` accepts default `setCode` / `setName` and checks admin; `insertCardBatch` upserts by set + collector and writes search fields. **Client:** `src/features/admin-set-cards/` (IndexedDB cache keyed by set + `cardDataVersion`, filters, `useInfiniteSlice` 40/page, add/edit sheet, delete confirm with link warnings, release shortcut) and `set-cards-page-client` / `cards-page-client` entrypoints; **Import:** `import-page-client` bulk array dry-run, per-row errors, `ingestionJobs` progress via `getIngestionJob`. **Docs:** [admin-catalog-images-r2.md](./admin-catalog-images-r2.md) (R2/image workflow until upload automation lands). **Context:** Backlog CRD-1 – CRD-9.
- **SET-1 – SET-8 — Admin sets hub**
  - **SET-1:** Virtualized sets grid (TanStack Virtual) with default sort (set # desc, then `releasedAt` desc, then code); columns code, name, set #, list card count, released/future, rotating, edit + open. Entry `sets-page-client.tsx` re-exports `sets-page/content.tsx` plus `hook`, `virtualized-sets-table`, `types`.
  - **SET-2:** Toolbar filters: search (code/name), checkboxes for released/future, rotating-only, optional `releasedAt` date range.
  - **SET-3:** “Add set” dialog → `api.admin.createSet` with optional fields; debounced `api.sets.isSetCodeAvailable` for unique code feedback.
  - **SET-4:** Edit set sheet → `api.admin.updateSet`; set **code** is read-only in the form.
  - **SET-5:** No `deleteSet` in the admin UI (unchanged; mutation remains for non-UI use only).
  - **SET-6:** Set detail hub: summary + Cards/Import cards, **Format legality** CTA to `/admin/formats`, **Mark released** when `isFuture` (updates `isFuture` / `releasedAt` via `updateSet`).
  - **SET-7:** `convex/setCardCountSync.ts` keeps `sets.cardCount` in sync on card create/update/delete and batch import paths; `reconcileAllSetCardCounts` internal mutation; `listWithCardCountAudit`, `getSetCardCountAudit` for stored vs “list” actual count; mismatch **tooltip** on list and **alert** on detail. `clearAllCards` action runs a full set recount after clear.
  - **SET-8:** `sets.updatedAt` / `sets.updatedBy` on schema; `createSet` / `updateSet` set audit fields. **Context:** Backlog SET-1 – SET-8.
- **IA-5 — Admin page shell (`AdminPageHeader`)** — Shared module `src/components/admin/`: `AdminPageHeader` (title, description, optional breadcrumbs/meta, primary `actions`, `toolbar` / `search`, count badge, optional sticky `subNav`, layout bleed for admin padding). `AdminSetSubNav` (Overview / Cards / Import + preserved `search` query). `AdminContentSubNav` (Hub, Media review, YouTube, UI matrix). Applied on admin dashboard, sets list, set detail, formats list, format detail, content hub, users placeholder, set cards, set import (`admin-dashboard-client`, `sets-page-client`, `set-detail-page-client`, `formats-page-client`, `format-detail-page-client`, `content/page.tsx`, `users/page.tsx`, `cards-page-client`, `import-page-client`, set cards/import wrappers). **Context:** Backlog IA-5.
- **IA-4 — Admin dashboard home** — `src/app/(app)/admin/admin-dashboard-client.tsx`: compact **counts** for sets, published catalog cards (`api.admin.getCardDataVersion` / `cardCount`), and formats (`api.formats.list`); **Published catalog** panel surfaces `cardDataVersion`, last release time, REL-oriented copy, link to set hub, and release placeholder. **Shortcuts:** last-opened set via `admin-prefs-storage.ts` + `use-admin-last-edited-set.ts` (fallback: newest set by `_creationTime`); `set-detail-page-client.tsx` persists last visited set code. Content hub shortcut retained. **Context:** Backlog IA-4.
- **IA-3 — Admin sidebar + set breadcrumbs** — `AdminSidebarContent` in `src/app/(app)/layout.tsx`: catalog order **Sets → Formats → Content → Users** (Users → `/admin/users` placeholder). `src/app/(app)/admin/users/page.tsx` shell for USR-*. `AdminSetBreadcrumbs` in `src/app/(app)/admin/sets/admin-set-breadcrumbs.tsx` on set overview, set cards, and set import: **Admin → Sets → {set name} →** Cards or Import. `AdminCardsPageClient` / `AdminImportPageClient` accept optional `breadcrumbs`. Admin dashboard grid includes Users. **Context:** Backlog IA-3.
- **IA-2 — Admin URL structure (formats detail, YouTube hub, card search deep links)** — Routes `/admin/formats/[key]` (format detail placeholder; list loads `api.formats.list` with row links) and `/admin/content/youtube` (Community YouTube curation shell); Content hub links to YouTube admin. Set overview passes optional `search` between overview, cards, and import; admin set cards sync `search` to the query string and expose a “Set overview” link that preserves it. **Context:** Backlog IA-2.
- **MC-007 — Admin media review queue (Next.js + Convex)** — [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) §3.3: `convex/schema.ts` — `mediaAssets.reviewedAt`, `reviewerUserId` for human decisions; `api.mediaAssets.listMediaAssetsNeedingReview`, `approveMediaAssetReview`, `rejectMediaAssetReview` (approve sets `teams.logoAssetId` like automatic approval). `src/app/(app)/admin/moderation/` (route `/admin/moderation`), admin dashboard + right-sidebar links. **Context:** Backlog MC-007.
- **MC-005 — `mediaAssets` + moderated upload read path (verify)** — Confirmed [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) §3.2: `convex/schema.ts` (`mediaAssets`, `kind` includes `team_logo` / `profile_avatar`), `convex/mediaAssets.ts` (`generateTeamLogoUploadUrl` / `submitTeamLogoUpload` / `finalizeTeamLogoModeration`), `convex/mediaAssetActions.ts` (`runTeamLogoModeration`), `convex/teams/logo.ts` (`getTeamLogoPresentation` — `displayUrl` only when asset `approved`). **Context:** Backlog MC-005 (closed; behavior shipped with TM-012).
- **MC-004 — Publish-time text moderation (Convex)** — [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) §1.3, §1.3.1: optional `TEXT_MODERATION_PROVIDER` (`off` \| `stub` \| `perspective` \| `azure` \| `openai`), threshold + `TEXT_MODERATION_ON_FAILURE` (`allow` \| `queue`). Actions `api.publishTierListComment.submitTierListComment`, `api.publishTeamChatMessage.submitTeamChatMessage`; `api.textModeration.publishGate` for clients; merged with `localCommentHeuristic`; audit fields on comments + chat. Team hub chat switches to the action when the gate is on. **Context:** Backlog MC-004.
- **MC-003 — Display-time profanity masking (client)** — [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) §1.3: `src/lib/moderation/profanity-display-text.ts` (`displayCommunityText`, `applyProfanityMaskToText`) and `use-profanity-display-text.ts` (uses `api.user.currentUser`). Masks **others’** text when the viewer’s filter is on; **own** decks/tier lists/chat/comments stay raw. Surfaces: tier list feed and browse cards, detail title (desktop + top bar) and lane labels for non-owners, new detail **Comments** list when `getDetail` returns rows, `DeckGridItem` + gallery decks sidebar names, team hub + **Team decks** tables, team chat message bodies. **Context:** Backlog MC-003.
- **MC-002 — Profanity filter Settings toggle (Next.js + Convex)** — [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) §1.1: the preference controls **display-time** masking on the viewer’s client when MC-003 wires surfaces (what you *see* from others in feeds/lists/chat). It does not by itself **publish-time** block or score submissions; public/team-visible **publish** checks are **MC-004** (`api.publishTierListComment.submitTierListComment`, `api.publishTeamChatMessage.submitTeamChatMessage`, §1.3.1). `convex/user.ts` adds `setProfanityFilterEnabled`; `src/app/(app)/settings/settings-page-client.tsx` — “Community content” card, copy distinguishes display vs publish, `useOptimistic` + `useTransition` + Sonner toasts, revert on failed mutation. **Context:** Backlog MC-002.
- **MC-001 — Profanity filter user preference (Convex)** — `users.profanityFilterEnabled` optional; `publicUserFromDocument` + `userValidator.profanityFilterEnabled` (boolean, default on when stored value is `undefined`); `api.user.currentUser` / `getById` and tier-list author payloads. [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) §1.2, §5, §6.1. **Context:** Backlog MC-001.
- **TM-009 — Teams discovery: aggregate team decks (Next.js + Convex)** — [teams-feature-implementation.md](./teams-feature-implementation.md) §6: `listAggregatedForMyTeams` in `convex/teams/teamDecks.ts` returns team-visible decks across all memberships the user can read (same `view_team_decks` + collaboration rules as `listForHub`); no teams outside the caller’s memberships. Routes: `/teams` and `/teams/decks` share `TeamsAreaNav` (My teams / Team decks). UI: `src/components/teams/teams-area-nav.tsx`, `src/components/teams/teams-decks/content.tsx`, `src/app/(app)/teams/decks/page.tsx`; team filter, collaboration toggle, links to each team hub, deck links to `/decks/[deckId]`. **Context:** Backlog TM-009.
- **TM-008 — Team hub: announcements, chat, events (Convex + Next.js)** — Schema tables `teamAnnouncements`, `teamChatMessages`, `teamEvents` per [teams-feature-implementation.md](./teams-feature-implementation.md) §5.4–5.6; new capabilities in `convex/teams/permissions.ts` (`post_team_chat`, `post_team_announcements`, `pin_team_announcements`, `moderate_team_chat`, `manage_team_events`); `getTeamViewerOrNull`; `getHubCapabilities`; `convex/teams/hub.ts`, `announcements.ts`, `chat.ts`, `events.ts` (auth-gated lists; `listPage` / `listUnpinnedPage` paginated; team dissolve cleans hub rows). App routes: `/teams/[teamId]/announcements`, `/chat`, `/calendar`, `/stats` (stats placeholder). UI: `team-hub/{announcements,chat,events,stats}-content.tsx`, shell nav. Realtime via `useQuery` / `usePaginatedQuery` on team hub. **Context:** Backlog TM-008.
- **TM-006 — Team hub (Next.js)** — `/teams` and `/teams/[teamId]` with overview (name, description, placeholder logo). Convex: `api.teams.permissions.listMyTeams`, `getTeam`. Conditional **Teams** nav via `buildMainNavItems` when the user has teams. Files: `src/components/teams/team-hub/*`, `src/components/teams/teams-index/*`, `src/components/shell/main-nav-build.ts`, `src/app/(app)/teams/**`.
  - **Context:** Backlog TM-006.
- **TM-002 — Teams capabilities and CRUD (Convex)** — `convex/teams/permissions.ts`: role → capability matrix per [teams-feature-implementation.md](./teams-feature-implementation.md) §4.2; `requireCapability`, `requireCaptain`, `getEffectiveTeamRole`, `userHasCapability`, `hasCapabilityForRole`; mutations `create` (caller becomes captain + membership row), `updateSettings` / `dissolve` (captain-only); queries `getTeam` (`view_team`), `listMyTeams`. Unit tests: `bun test tests/teams-permissions.test.ts`. API: `api["teams/permissions"]` (codegen).
  - **Context:** Backlog TM-002.
  - **Files:** `convex/teams/permissions.ts`, `tests/teams-permissions.test.ts`, `convex/_generated/api.d.ts`.
- **CAT-006 — Versioned static catalog design** — [cat-006-versioned-static-catalog.md](./implementation/notes/cat-006-versioned-static-catalog.md): gzip JSON on R2/CDN keyed by `cardDataVersion`; security (public-data scope, **sha256**-style integrity from Convex, HTTPS, CORS or Next proxy, parse/size limits); **immutable** long-cache headers for versioned URLs; **fallback** matrix to today’s `getCardDataVersion` + `fetchFromConvex` / IndexedDB path; implementation follow-ups listed.
  - **Context:** Backlog CAT-006.
  - **Files:** `docs/implementation/notes/cat-006-versioned-static-catalog.md`.
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
- **RSC-007 — Resizable panel primitive spike** — [rsc-007-resizable-panels-spike.md](./implementation/notes/rsc-007-resizable-panels-spike.md): compared shadcn Resizable / `react-resizable-panels` to custom `useRightSidebarResize`; **verdict keep custom** (shell `PanelGroup` integration cost vs. unproven jank win; hit targets and calm/expressive tokens achievable on the existing handle; local rAF/pointer/split-context levers if drag perf is profiled). **No merge** of the library in this pass.
  - **Context:** Backlog RSC-007.
  - **Files:** `docs/implementation/notes/rsc-007-resizable-panels-spike.md`.
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

### Changed

- **IA-1 — Admin IA v2 primary areas** — Right sidebar `AdminSidebarContent` in `src/app/(app)/layout.tsx`: primary catalog nav is **Sets**, **Formats**, **Content** (replacing top-level Cards/Import). **Cards** and **Import** appear only in set context via a nested block (Overview / Cards / Import) when the route is under `/admin/sets/[code]`. New routes: `/admin/formats` (placeholder), `/admin/content` (hub linking to moderation and UI matrix), `/admin/sets/[code]` (set overview with links), `/admin/sets/[code]/cards`, `/admin/sets/[code]/import`. `/admin/cards` and `/admin/import` redirect to `/admin/sets`. `admin-dashboard-client.tsx` and `sets-page-client.tsx` updated; card list uses `api.cards.list` with `set: [setCode]`. **Context:** Backlog IA-1.

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

### Fixed

- **RSC-003 — Gallery density vs right sidebar** — Open vs closed `cardsPerRow` presets apply from a sidebar signal delayed 220ms (aligned with `RightSidebarExpandedPanel` slide; no delay when `prefers-reduced-motion`), so the virtualized grid column count does not flip in the same window as the shell main-column width change. `setGalleryCardsPerRow` still keys off the live `activeSidebarActionId`.
  - **Context:** Backlog RSC-003.
  - **Files:** `src/providers/GalleryFiltersProvider.tsx`.

### Changed

- **RSC-004 — Stable `activeDropZone` at drop-zone boundaries** — Pointer hit-testing during drag still runs once per coalesced `requestAnimationFrame`, but `activeDropZone` React state now updates only after two consecutive frames report the same zone. Immediate hit results stay in `resolvedDropTargetRef` so `endDrag` resolves the correct target even when hover UI is stabilizing.
  - **Context:** Backlog RSC-004.
  - **Files:** `src/lib/dnd/tcg-dnd-provider.tsx`.
- **RSC-005 — Narrow droppable hover subscriptions** — Committed drop highlight is driven by a module-level `useSyncExternalStore` snapshot (not `TcgDndProvider` React state), so moving the pointer across zones does not re-render the whole provider subtree. `useTcgDroppable` subscribes via per-zone `useTcgActiveDropZoneIsOver(id)` plus stable `useTcgDndActions` / `useTcgDndDragState` slices; `useTcgDnd` still exposes `activeDropZone` via the same store.
  - **Context:** Backlog RSC-005.
  - **Files:** `src/lib/dnd/tcg-dnd-provider.tsx`, `src/lib/dnd/use-tcg-droppable.ts`, `src/lib/dnd/index.ts`.

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

