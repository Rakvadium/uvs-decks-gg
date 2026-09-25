# Multi-game platform (Phases 1–2)

The app is becoming **tcgdecks.gg**: one account, many TCGs, each game on its own subdomain
(`uvs.tcgdecks.gg`, later `cyberpunk.tcgdecks.gg`). UniVersus (`uvs`) is the only game shipped
in Phases 1–2; Cyberpunk TCG is Phase 3.

This doc is the design contract. Implementers follow it; if code evidence forces a change,
update this doc in the same change.

## Vocabulary

- **GameId** — string id of a game. `GAME_IDS = ["uvs", "cyberpunk"] as const`, `DEFAULT_GAME_ID = "uvs"`.
  Cyberpunk TCG (Phase 3) has its own contract: [games/cyberpunk.md](games/cyberpunk.md).
- **Game module** — everything game-specific (rules, filters, card rendering, deck setup,
  import/export, stats, simulator config, theme, terminology).
- **Game-scoped** data/route — belongs to exactly one game (cards, sets, formats, decks, …).
- **Global** data/route — shared across games (users, teams, settings, moderation, …).

## Code layout

| Path | Contents | Imported by |
| --- | --- | --- |
| `shared/games/types.ts` | `GameId`, `GAME_IDS`, `DEFAULT_GAME_ID`, `isGameId`, `SharedGameModule` type | convex + src |
| `shared/games/registry.ts` | `SHARED_GAME_MODULES: Record<GameId, SharedGameModule>`, `getSharedGameModule(id)`, `getSharedGameModuleOrDefault(untrusted)` | convex + src |
| `shared/games/uvs/**` | Pure TS UVS logic with no React/Next/Convex-runtime deps: deck setup type + normalizer, deck validation rules, card eligibility, stat filter definitions, card type order, import/export text format | convex + src |
| `shared/games/cyberpunk/**`, `shared/games/rules-common.ts`, `shared/games/deck-setup.ts` | Cyberpunk TCG module (see [games/cyberpunk.md](games/cyberpunk.md)); generic rule helpers; setup dispatch helpers | convex + src |
| `shared/hosts.ts` | Host → `{ kind: "game" \| "apex" \| "standalone", game }` resolution and cross-host URL builders | middleware, src, convex |
| `src/games/types.ts` | `ClientGameModule` (extends shared module with React components/hooks) | src |
| `src/games/registry.ts` | `CLIENT_GAME_MODULES`, `getClientGameModule(id)` | src |
| `src/games/uvs/**` | UVS React components (`components/**`: card rendering, symbols, character picker, stat filter adornment), `config.ts` (keywords, symbols, colors, `UNIVERSUS_CONFIG`), `ui.ts` (the `ui` contract impl), `deck-stats.ts` | src |
| `src/components/card/**` | Game-agnostic card pieces: `CardNavigationProvider`/`useCardNavigation`, `CardFlipButton`, `CardDeckControls`, `CARD_GLOW_*`, `galleryCardImageSizes` | src |
| `src/games/game-context.tsx` | `GameProvider`, `useGameId()`, `useGameModule()`, `useHostKind()` | src |

- `src/` imports shared code via the tsconfig alias **`@shared/*` → `./shared/*`**.
  `convex/` imports shared code via **relative paths** (`../shared/games/...`).
  `gameIdValidator` (`convex/validators.ts`) is built from `GAME_IDS`, so adding a game only
  touches `shared/games/types.ts` (+ its modules).
- Old import paths (`@/config/universus`, `@/lib/universus/*`, `@/components/universus/*`) stay
  as one-hop re-export wrappers (component-architecture playbook) so unrelated code keeps working.
  New shared code must not import them.
- Game-agnostic shared components get game behavior through `useGameModule()` (client) or
  `getSharedGameModule(game)` (server), never by importing UVS modules directly.

## Client UI contract (`ClientGameModule.ui`, `src/games/types.ts`)

`ClientGameModule extends SharedGameModule` with `ui: ClientGameUi`. Generic components under
`src/components/**` / `src/providers/**` read game UI from `useGameModule().ui` and never import
`@/games/uvs/**`, `@/components/universus/*` or `@/config/universus` (those old paths are wrappers only).

| Member | Purpose (UVS impl) |
| --- | --- |
| `CardDetailsDialog`, `CardDetailsContent` | Card details modal / inline details panel |
| `CardGridItem` | Gallery/deck grid card tile (deck actions, flip, drag); both games render the shared `CardGridItemShell` (`src/components/card/grid-item/`) with their own face + details dialog |
| `CardImageDisplay` | Card image with "No Image" fallback |
| `SymbolIcon`, `SymbolBadge`, `getSymbolPath`, `getSymbolColor` | Symbol/identity images and chip colors |
| `DeckSetupPanel` | Deck setup UI, `variant` `hero` (deck details column) / `sidebar` (gallery active deck) / `compact` (deck tiles; UVS renders nothing). Props: `setup`, `getCard`, `onChange(patch)`, `readOnly`, `mainQuantities`, `coverCard`, `overlay`, … (UVS: starting character + identity; Cyberpunk: 3 Legend slots + RAM budget) |
| `SetupCardPickerDialog` | Deck setup card picker: `setup` + `onChange(patch)`, optional `slotIndex` (UVS: starting character; Cyberpunk: Legend picker) |
| `CardSetupAction` | Card details toggle that puts a card in the setup (UVS: Set As Starting Character; Cyberpunk: Set As Legend) |
| `deckSetup` | Pure helpers + copy: `emptySetupLabel`, simulator hints, `importPatch(parsed, findCards)`, `resolveSetupAdd(card, setup, getCard)` (Legend added to main → "Add as Legend" toast via `offerSetupAdd`, `src/lib/deck/setup-add-fallback.ts`) |
| `StatsQuickFilterAdornment` | Compact active stat-filter chips |
| `getCardTypeColor`, `getKeywordColor` | Filter token chip colors |
| `formatCardType` | Normalizes raw card types before grouping/labels |
| `deckStats` | Deck stats pie palette (`cardTypeColors`, `zoneColors`, `numericShades`) |
| `deckStatsCharts` | Deck stats sidebar charts (`cardType` / `numeric` (+ `display: "bars"` curve) / `labels`; optional `filter`, `labelColors`) |

- Prop contracts (`GameCardGridItemProps`, …) live next to `ClientGameUi` and use `CachedCard`;
  each game's components must satisfy them (`UVS_CLIENT_UI ... satisfies ClientGameUi` in `src/games/uvs/ui.ts`).
- Module objects are static constants, so `const { CardGridItem } = useGameModule().ui;` inside a
  component yields a stable component identity (no remounts). Call it at the top of the component
  like any hook; pure helpers that are not components/hooks take the function as a parameter
  (e.g. `buildSectionGroups(..., formatCardType)`).
- Theme: `ThemeInjector` reads `useGameModule().theme`.
- Keep `ui` components as `export function` declarations: the registry imports every game's `ui`,
  and game components import generic providers that call `useGameModule()`, so hoisted function
  exports keep those import cycles safe (a `const X = memo(...)` export could hit the TDZ).

## Deck setup (replaces `startingCharacterId` / `selectedIdentity`)

```ts
// convex/validators.ts
export const uvsDeckSetupValidator = v.object({
  game: v.literal("uvs"),
  startingCharacterId: v.optional(v.id("cards")),
  selectedIdentity: v.optional(v.string()),
});
export const deckSetupValidator = v.union(uvsDeckSetupValidator, cyberpunkDeckSetupValidator); // Phase 3
```

Phase 3: `DeckSetup` / `DeckSetupPatch` (`shared/games/deck.ts`) are unions discriminated by
`game`; `DeckSetupSource` is `{ setup?: DeckSetup | null } +` the legacy UVS fields. Each module's
setup functions accept the union: `normalizeSetup` ignores a foreign setup (returns its own empty
setup), `applySetupPatch` throws on a foreign patch, `setupCardIds` / `setupPreviewCardId` return
nothing for one. `decks.create`/`update` use `resolveDeckSetupPatchArgs` (`shared/games/deck-setup.ts`).
Generic setup UI goes through `ui.DeckSetupPanel` / `ui.deckSetup`; card addability passes
`rules: module.deck` to `canAddCardToSection` / `canMoveCardToSection` (default: UVS rules). Deck tiles and the
hero "Ready" badge use `mainDeckTarget(module)` (`src/games/main-deck-target.ts`, default format `minDeckSize`).

- `decks.setup: v.optional(deckSetupValidator)`.
- Legacy top-level `startingCharacterId` / `selectedIdentity` stay in the schema as
  **deprecated optional** fields until the backfill has run in production. Writers only write
  `setup` (and clear the legacy fields when they patch). Readers go through one normalizer:
  `normalizeDeckSetup(deck)` in `shared/games/uvs/setup.ts`, which prefers `setup` and falls
  back to the legacy fields.
- Mutation API: `decks.create` accepts `setup: v.optional(deckSetupValidator)`. `decks.update` accepts
  `setup: v.optional(v.union(deckSetupPatchValidator, v.null()))` — the patch validator makes each
  field `id | string | null` so today's null-clears semantics hold per field (`applyDeckSetupPatch`);
  `setup: null` clears the whole setup. Writers always write a `setup` object (possibly `{ game }`)
  and unset the legacy fields. The legacy `startingCharacterId` / `selectedIdentity` args are still
  accepted for one release and folded in by `mergeLegacyDeckSetupArgs` (explicit `setup` fields win).
- Backfill: `convex/migrations/migrateDeckSetup.ts` — `run` (internalMutation, `cursor`/`batchSize`
  args, 200 per page, reschedules itself until done; `once: true` for a single page) and `status`
  (internalQuery over one page; loop on `continueCursor` and sum `pending`). The per-doc transform is
  `deckSetupMigrationPatch` in `shared/games/uvs/setup.ts`.

### Deck module (`SharedGameModule.deck`, `shared/games/deck.ts`)

`normalizeSetup`, `applySetupPatch`, `setupCardIds`, `setupPreviewCardId`, `validation.{plan,validate}`, `cardTypeOrder`,
`cardTypeLabels`, `sideboardLimit`, `isMainDeckEligible`, `getCardCopyLimit`, `simulatorHandSize`,
`extractZones`, `zoneTone`, `text.{mainTypeOrder,parse,format}`. UVS implementations live in
`shared/games/uvs/{setup,rules/*,card-eligibility,card-types,deck-text,zones,deck}.ts`.
Validation is two-phase so rules stay pure: `plan(deck, format)` names the cards to load,
`convex/lib/deckFormatRules.ts` loads them (+ `cardLegality`) and calls `validate(...)`;
`convex/deckValidation.ts` picks the rules via the deck's game module. Old client paths
(`src/lib/deck/card-eligibility.ts`, `display-config.ts`, `components/deck-details/uvs-import-export.ts`,
`deck-list-utils.ts` zone helpers) re-export from `shared/games/uvs/*`.

## `game` on game-scoped tables

`game: v.optional(gameIdValidator)` is added to: `cards`, `sets`, `cardDrafts`, `formats`,
`cardLegality`, `setLegality`, `formatErrata`, `cardTextHistory`, `decks`, `collections`,
`tierLists`, `communityCardRankings`, `communityTierSnapshots`, `cardDataVersion`,
`cardFacetSnapshot`, `ingestionJobs` (if card-related). Child tables that are always reached
through a scoped parent (`tierListItems`, `deckLikes`, `deckViews`, `deckShares`,
`deckBuilderSessions`, `deckPresence`) do not get the field.

- Field stays **optional in the schema** so production deploys succeed before the backfill.
  All writers must set it. Readers treat a missing value as `DEFAULT_GAME_ID` only where they
  cannot use an index (e.g. `doc.game ?? DEFAULT_GAME_ID`).
- New indexes lead with `game` (e.g. `sets.by_game_and_code`, `formats.by_game_and_key`,
  `decks.by_game_and_visibility`). Keep the old indexes until the follow-up tightening change.
  Search indexes add `game` to `filterFields`.
- Singletons become per-game rows: `cardDataVersion` gets `by_game`; `cardFacetSnapshot`
  key stays `"default"` but is looked up `by_game_and_key`.
- Public queries/mutations/actions over game-scoped data take `game: v.optional(gameIdValidator)`
  and resolve it with `withResolvedGame(args)` / `resolveGame(args.game)` (`convex/lib/gameScope.ts`;
  missing = `DEFAULT_GAME_ID`) so frontends built before multi-game (tabs open during a rolling
  deploy) keep working. Clients always pass `game` explicitly. **Tighten to required in the
  follow-up change.** Global ones (users, teams, settings) don't take `game`.
- `sessions` (per user) moves game-specific UI state into `gameState: v.optional(v.record(v.string(), v.object({ activeDeckId?, galleryFilters?, rightSidebarAction? })))`
  keyed by GameId, falling back to the legacy top-level fields for `uvs`.
- Backfill: `convex/migrations/backfillGameField.ts` — **paginated** (`.paginate()` + scheduler
  self-rescheduling, one table per invocation), idempotent, returns counts. Existing migrations
  `collect()` whole tables; do not copy that for `cards`/`decks`.

Implementation (Phase 2 data-scoping step):

- Helpers: `convex/lib/gameScope.ts` (`docGame`, `isDocInGame`, `byCreationTime`,
  `gameValuesWithLegacy`, `getCardDataVersionDoc`, `getCardFacetSnapshotDoc`, legacy-aware
  lookups `findInGame` / `collectInGame` / `gameTagPatch` / `firstLoggingDuplicates` and
  `findSetByCode` / `findFormatByKey` / `findCardBySetAndNumber` / `findSetLegality`,
  `resolveGame` / `withResolvedGame`),
  `convex/lib/gameBackfill.ts` (`GAME_SCOPED_TABLES`, `gameBackfillPatch`),
  `convex/lib/sessionGameState.ts` (`resolveSessionGameState`, `nextSessionGameState`).
  Return validators in `convex/validators.ts` carry `game: v.optional(gameIdValidator)`.
  Tests: `tests/multi-game-scoping.test.ts`, `tests/game-scope-lookup.test.ts`.
- Indexes added (old ones kept): `cards.by_game`, `by_game_and_setCode_and_collectorNumber`,
  `by_game_and_setCode_and_name`, `by_game_and_type_and_name`, `by_game_and_oracleId`,
  `by_game_and_setName` (`cards.listPaginated` set-name filter);
  `sets.by_game_and_code`, `by_game_and_setNumber`; `cardDrafts.by_game_and_setCode_and_status_and_sortIndex`;
  `formats.by_game_and_key`; `cardLegality.by_game_and_format`; `setLegality.by_game_and_format`,
  `by_game_and_format_set`; `formatErrata.by_game_and_format_and_sortOrder`;
  `decks.by_game_and_isPublic`, `by_game_and_visibility`; `collections.by_user_and_game`;
  `tierLists.by_user_and_game_and_updatedAt`, `by_game_and_isPublic_and_updatedAt`,
  `by_game_and_isPublic_and_rankingScope_and_updatedAt`,
  `by_game_and_isPublic_and_rankingScope_and_scopeKey_and_updatedAt`;
  `communityCardRankings.by_game_and_scope`, `by_game_and_scope_and_adjustedScore`;
  `communityTierSnapshots.by_game_and_scope`, `by_game_and_scopeType_and_lastComputedAt`;
  `cardDataVersion.by_game`; `cardFacetSnapshot.by_game_and_key`. All four `cards` search
  indexes filter on `game`.
- Reads through a game index do **not** see untagged docs, so `uvs` lists are empty between the
  deploy and `backfillGameField:runAll` (run it right after deploying). Exceptions that keep
  working before the backfill: singletons (`cardDataVersion`, `cardFacetSnapshot`: the `game`
  row, else the untagged row for `uvs`; writers patch that row and tag it), the facet rebuild
  (also scans untagged cards for `uvs`), `communityRankings.recomputeScope` (for `uvs` it clears
  untagged cache rows **and** rebuilds from tagged + untagged public tier lists, so a save before
  the backfill doesn't wipe rankings), and small per-user / by-id reads that filter with
  `isDocInGame` (`decks.listByUser`, by-id `getById`/`getDetail`/…).
- Writers/upserts that look up an existing row by a natural key (`admin.upsertSet`, `createSet`,
  `createFormat`, `seedFormats`, `upsertCardsBatch`, `insertCardBatch`, `linkCardFaces`,
  `upsertSetLegality`, `importFormatLegalityBundle`, `cardDrafts` set lookups,
  `setCardCountSync`) use the legacy-aware helpers: for `uvs` they also find the untagged row,
  update it instead of inserting a duplicate, and tag it (`gameTagPatch`). Replace-mode legality
  imports delete tagged and untagged rows. By-key reads that used `.unique()` (`sets.getByCode`,
  `formats.getByKey`, deck validation's format lookup, …) go through the same helpers, which
  return the first row and log duplicates instead of throwing.
- When the `tierLists` backfill finishes, `backfillGameField:run` schedules
  `communityRankings.recomputeAllScopes` for every game (global + every set scope with a public
  ranked list or an existing snapshot), so the ranking cache is rebuilt from tagged data. It is
  safe to run manually (`npx convex run communityRankings:recomputeAllScopes '{"game":"uvs"}'`).
- Whole-table `.collect()`s switched to a game index (`sets.list`, `formats.list`, …) re-sort
  with `byCreationTime` so ordering matches the old table scan.
- By-id reads (`cards.getById`, `decks.getById`, `tierLists.getDetail`, `sets.getById`, …) take
  `game` and return `null` for another game's doc. Mutations on an existing doc by id (deck
  card edits, `tierLists.toggleLike`, `admin.updateCard`, …) don't take `game`; they use the doc's
  own game (`docGame(doc)`). Decks reject cards/setup of another game; `decks.create` takes
  `game` and builds `setup` from that game's module (`setup.game === deck.game`);
  `decks.duplicate` copies `game`; deck validation uses `deck.game ?? DEFAULT_GAME_ID`
  (`convex/lib/deckGame.ts`), formats `by_game_and_key`, legality `by_game_and_format`.
- `cardLegality` (format, card) lookups keep `by_format_card`: the card id already implies the
  game (writers check `requireCardInGame`). `collections` per-card lookups keep `by_user_and_card`
  for the same reason.
- Internal/admin HTTP endpoints (`convex/adminHttp.ts`: upsert-set, upsert-cards-batch,
  link-card-faces, create-drafts, rebuild-catalog-aggregates) accept an optional JSON `game`
  (default `DEFAULT_GAME_ID`, unknown ids rejected), so existing ingest scripts keep working.
  `rebuild-catalog-aggregates` answers 401 only for auth failures; bad JSON / unknown game is 400.
  Matching internal mutations (`admin.upsertSet`, `upsertCardsBatch`, `linkCardFaces`,
  `cardDrafts.createDraftsFromStorageIdsInternal`, `cardFacets.rebuildCardFacetSnapshot`,
  `sets.reconcileAllSetCardCounts`, `cards.updateCardDataVersion`/`initializeCardDataVersion`,
  `seedDummyDecks.seed`) take optional `game` with the same default.
- Cross-game references are rejected: `tierLists.save` items (and the derived preview/featured
  ids), `decks.update` `imageCardId`, and admin face links (`updateCard` / `updateCardFromJson` /
  `createCardVariantFromJson` `backCardId`/`frontCardId`) must be cards of the same game.
- Sessions: `getSession`, `getActiveDeckId`, `setActiveDeck` take `game`. `getSession` returns
  the resolved per-game `activeDeckId`/`galleryFilters`/`rightSidebarAction` at top level
  (never `gameState`). `updateSession` takes optional `game` (scopes
  `galleryFilters`/`rightSidebarAction`, defaulting to `DEFAULT_GAME_ID` when omitted; appearance
  fields are global). Once `gameState[game]`
  exists it is authoritative; the first write for `uvs` seeds it from the legacy fields.
- Not scoped (on purpose): team deck lists (`teams/teamDecks.ts`, global team hub), admin user
  moderation counts (`adminUsers.ts`), child tables, maintenance actions
  (`cards.updateImageUrlsRemoveLeadingZeros*`, `admin.migrateCardField*`) and old migrations.

## Catalog, storage keys

- R2 catalog: `catalog/{game}/v{n}.json.gz` (`catalogObjectKeyForVersion(game, version)`).
  The `cardDataVersion` row stores the full object key, so old `catalog/v{n}` rows keep working
  until the next publish. Cleanup deletes per game.
  Implementation: `catalogRelease.releaseCatalog` / `admin.releaseCards` take `game`;
  `prepareRelease`, `uploadCatalogBlob`, `finalizeRelease`, `cleanupOldCatalogBlobs` are per game.
  Cleanup deletes only `catalogObjectKeysToDelete(game, n)`: `catalog/{game}/v{n}` plus, for
  `uvs`, the legacy `catalog/v{n}` (version numbers continue from the legacy row, so old blobs age
  out normally). Publishing reads cards `by_game`, so run the backfill before the first publish.
- Card images stay under `cards/` (keys are already set-code based).
- IndexedDB: `tcgdecks-{game}-cards`, `tcgdecks-{game}-sets`. Old `universus-*` DBs are
  ignored (catalog re-downloads once) and deleted best-effort.
- localStorage: `tcgdecks:{game}:{key}` for game-scoped UI state, `tcgdecks:{key}` for global.
  On first read, fall back to the legacy `uvs-decks-*` key (for `uvs` only) and migrate it.

Implementation (Phase 2 routing step) — helpers in `src/lib/storage-keys.ts`
(`gameStorageKey`, `globalStorageKey`, `appEventName`, `catalogDbName`, `legacyGameKey`,
`readStorageWithLegacy`, `deleteLegacyDatabaseOnce`; tests in `tests/storage-keys.test.ts`):

| Key | Scope | Legacy key migrated on first read |
| --- | --- | --- |
| `activeDeckId`, `galleryFilters`, `galleryFormat`, `gallerySets`, `gallerySortField`, `gallerySortDirection`, `rightSidebarAction` (UIStateProvider) | game | `uvs-decks:{key}` (uvs only) |
| `galleryViewMode`, `galleryCardsPerRow` (+ old `…Open`/`…Closed`) (UIStateProvider) | global | `uvs-decks:{key}` |
| `tcgdecks:left-sidebar-collapsed` (`(app)/layout.tsx`) | global | `uvs-decks-left-sidebar-collapsed` |
| `tcgdecks:right-sidebar-width` (`shell-slot-provider/types.ts`) | global | `uvs-decks-right-sidebar-width` |
| `tcgdecks:{game}:admin-last-set-code` (`admin/admin-prefs-storage.ts`) | game | `uvs-decks-admin-last-set-code` (uvs only) |

- Window events: `tcgdecks:admin-last-set-changed`, `tcgdecks:deck-details-simulator-redraw`.
- localStorage is per origin, so the migration only helps on hosts that already had the legacy
  keys (standalone/localhost/previews); `uvsdecks.gg` users start fresh on `uvs.tcgdecks.gg`.
- IndexedDB: `card-store.ts` / `set-store.ts` functions take `game` first; `useUniversusCards` /
  `useSets` read it via `useGameId()`. The first store open per page load calls
  `indexedDB.deleteDatabase("universus-cards" | "universus-sets")` (best effort). The Convex
  catalog/sets queries (`cards.getCardDataVersion`, `listReleasedPaginated`,
  `batchGetCardsByIds`, `sets.list`, `formats.*`) take `game` from `useGameId()`.

## Hosts and routing

`shared/hosts.ts`:

```ts
ROOT_DOMAINS = ["tcgdecks.gg", "tcgdecks.localhost"]   // + NEXT_PUBLIC_ROOT_DOMAINS override
LEGACY_REDIRECT_HOSTS = { "uvsdecks.gg": "uvs", "www.uvsdecks.gg": "uvs" }
resolveHost(host) =>
  "{game}.{root}"            → { kind: "game", game, root }
  "{root}" / "www.{root}"    → { kind: "apex", game: null, root }
  anything else              → { kind: "standalone", game: DEFAULT_GAME_ID }
                               (bare localhost:8090, LAN IPs, *.vercel.app previews)
```

Implementation notes (Phase 1 foundation):

- `NEXT_PUBLIC_ROOT_DOMAINS` (comma list) **replaces** the defaults; invalid entries are dropped.
  Convex reads it too (`isAllowedHandoffOrigin`), so set it as a Convex env var when overriding.
- `resolveHost` lowercases, strips port and trailing `.`; IPv6/IP literals are standalone.
  `{x}.{root}` where `x` is not a GameId (or deeper, e.g. `a.uvs.{root}`) returns
  `{ kind: "apex", unknownSubdomain: true }` — middleware redirects it to the apex.
  Every result carries `port` (string | null). Legacy hosts resolve as `standalone`; middleware
  checks `legacyRedirectGame(host)` first.
- `apexOrigin(root, protocolHint?, port?)` / `gameOrigin(game, root, protocolHint?, port?)`:
  real roots are always `https` with no port; `.localhost` roots default to `http` and keep the port.
- `gameUrl(game, path, currentHostInfo, protocolHint?)` returns an absolute URL on game/apex
  hosts and the host-relative path on standalone (single-game) hosts.
- `isAllowedHandoffOrigin(origin)` requires the input to equal `new URL(origin).origin`
  (canonical, no path/query/userinfo/trailing slash or dot), kind `game`, and `https` + default
  port for real roots (`http`/`https`, any port, for `.localhost` roots).
- `GameProvider({ game, hostKind })` also exposes `useHostKind()`. Outside a provider the hooks
  return the default game / `"standalone"`, so components can adopt them before routing lands.
- Next 16 deprecates `src/middleware.ts` in favor of `proxy.ts`; the routing step kept
  `middleware.ts` (see below).

- **Standalone** behaves exactly like today: default game, local sign-in, no handoff.
  This keeps `localhost:8090`, LAN testing, CI, and Vercel previews working.
- **Game host** (`uvs.tcgdecks.gg`, dev `uvs.tcgdecks.localhost:8090`): game routes; sign-in
  goes through the auth host.
- **Apex** (`tcgdecks.gg`, dev `tcgdecks.localhost:8090`): `/` game picker, `/sign-in`,
  `/sign-up`, `/auth/*`, `/agent-login`, `/api/*`. Any other path redirects to
  `{DEFAULT_GAME}.{root}` with the same path.
- **Legacy** `uvsdecks.gg/*` → 301 `https://uvs.tcgdecks.gg/*`.

App Router layout: game-scoped routes live under `src/app/(app)/[game]/…`
(`gallery`, `decks`, `decks/[deckId]`, `collection`, `community/**`, `admin/sets/**`,
`admin/cards`, `admin/formats/**`, `admin/import`). Global routes stay where they are.
**User-visible URLs do not contain the game** — middleware rewrites `/gallery` →
`/{game}/gallery` for game-scoped prefixes (`GAME_SCOPED_PREFIXES` in `shared/hosts.ts`).
Internal links stay host-relative (`/decks/123`); only cross-game/apex links use
`gameUrl(game, path)` which builds an absolute URL.

The middleware sets request header `x-tcg-host-kind` and `x-tcg-game`; the root layout reads
them and renders `GameProvider`. Direct requests to `/uvs/...` are 404 (rewrites only).

Implementation (Phase 2 routing step):

- **Decision logic** is the pure `routeRequest({ host, pathname, search, protocol })` in
  `src/lib/routing/route-request.ts` → `{ type: "next" | "rewrite" | "redirect" | "notFound" }`
  (tests: `tests/route-request.test.ts`). Order: legacy host → 301; apex unknown subdomain → 307
  to `{apex}/`; apex allowed path (`/`, `/sign-in`, `/sign-up`, `/agent-login`, `/auth[/…]`,
  `/api[/…]`) → next, anything else (incl. `/tour`) → 307 to `{DEFAULT_GAME}.{root}` + path +
  query; game/standalone: first segment is a GameId → notFound, `isGameScopedPath` → rewrite to
  `/{game}{path}{query}`, else next. Apex requests carry `x-tcg-game: {DEFAULT_GAME_ID}` +
  `x-tcg-host-kind: apex`.
- **`src/middleware.ts`** stays a `middleware.ts` (Next 16 logs a deprecation warning).
  `convexAuthNextjsMiddleware` is typed for `NextMiddleware`/edge; renaming to `proxy.ts`
  (Node runtime) is a separate, low-value change, so it was deferred. The handler runs *inside*
  `convexAuthNextjsMiddleware`, so `/api/auth` POSTs are still proxied to Convex before routing
  runs and token refresh cookies still propagate. Redirect decisions return first; then the
  existing "authenticated on /sign-in|/sign-up|/agent-login → /home" rule; then rewrite/next with
  `NextResponse.rewrite|next(…, { request: { headers } })` (headers copied from the request so
  refreshed auth cookies survive; our `x-tcg-*` values overwrite client-supplied ones).
  `notFound` rewrites to `/__tcg-not-found`, which matches no page → root not-found UI, 404.
  Matcher unchanged (skips `_next` and any path with a dot).
- **Server helper** `getRequestGame()` (`src/lib/routing/request-game.ts`) reads the headers
  (falls back to `resolveHost(host)`); used by the root layout (wraps `Providers` in
  `GameProvider`, passing the resolved `host` + `x-forwarded-proto` for cross-host links; derives
  metadata via `generateMetadata`) and the root page (apex → game picker linking to
  `gameOrigin(game, root)/gallery`; otherwise `redirect("/gallery")`).
- **`src/app/(app)/[game]/layout.tsx`** `notFound()`s unless `isGameId(params.game)`.
  `[game]/admin/layout.tsx` re-exports `(app)/admin/layout.tsx` so game-scoped admin pages keep
  the admin role gate. `usePathname()` returns the user-visible (unprefixed) path, so the admin
  sidebar and `getPageType` in `(app)/layout.tsx` are unchanged; `useParams()` now also has `game`.
- Absolute links built from `window.location.origin` (private deck links, team invites) are
  same-host and unchanged.

## Brand, game switcher, apex picker (Phase 2 UI step)

- **Brand:** `SharedGameModule.brand = { wordmark: [lead, accent, suffix], title, description }`
  (UVS: `["UVS", "DECKS", ".GG"]`, `UVSDECKS.GG`); `PLATFORM_BRAND` (`TCGDECKS.GG`) in
  `shared/games/types.ts`. `getHostBrand(hostKind, game)` (`shared/games/registry.ts`) picks the
  platform brand on the apex, else the game's (game + standalone hosts). The root layout's
  `generateMetadata` builds the title default/template (`%s | {brand.title}`) and description from
  it; the client reads it with `useBrand()`. `AppBrandWordmark` / `AppBrandRailWordmark` /
  `AppBrandLink` (aria-label) render the brand parts. Per-page descriptions that still say
  "UVSDECKS.GG"/"UniVersus" are UVS copy and change when a second game ships.
- **Game switcher:** `buildGameSwitcherModel(host, game, protocol)` (`src/games/game-links.ts`,
  tests `tests/game-switcher.test.ts`) → current game, one entry per `GAME_IDS` game (current =
  host-relative `/gallery`, others = `gameUrl(id, "/gallery")`), and `allGamesHref` = apex `/`.
  It returns `null` on standalone and apex hosts, so the switcher only renders on game hosts
  (standalone serves one game and can't link across hosts; the apex has its own picker).
  `GameProvider` exposes it as `useGameSwitcher()`. Components: `src/components/shell/game-switcher/`
  (`GameBadge` — short name tinted with the module's `theme.primary`; `menu-content.tsx`;
  `sidebar.tsx`; `profile-sheet-section.tsx`).
- **Placement:** the floating-header and mobile-shell docs have no slot for a cross-game switch,
  so it goes in persistent shell chrome, not page bars:
  - Desktop: left sidebar, directly under the wordmark (`LeftSidebarBrand` → `SidebarGameSwitcher`
    → divider → nav). It's a sidebar-item-styled `DropdownMenu` trigger (badge + game name +
    chevrons; badge-only with a tooltip when collapsed). The "UniVersus" item near the bottom of
    the sidebar is the media dock toggle (`ShellUniversusNav`) and is unrelated.
  - Mobile: a "Game" section at the top of the profile sheet (the sheet holds "full navigation"
    per `mobile-shell.md`), above "Navigate". The Go capsule stays fixed. Signed-out users reach
    other games from the apex picker.
- **Apex picker** (`src/app/page.tsx`): platform wordmark + one `Card` per registered game (theme
  gradient stripe, `GameBadge`, name, brand, "Open {short}" → `gameOrigin(id)/gallery`) and a
  dashed "More games coming" tile so a single game still fills a 2-column grid.

## Central auth host (handoff)

Convex Auth cookies are per-host and its Next.js middleware can't set a cookie `Domain`, so
subdomains get their own sessions via a one-time handoff from the apex. Pure pieces (URL
builders, `sanitizeSameOriginPath`, code checks, hint cookie) live in `shared/auth-handoff.ts`
(tested in `tests/auth-handoff.test.ts`); browser helpers in `src/lib/auth/handoff-client.ts`.

1. Game host, signed out, any "Sign in"/"Sign up" (`openAuthDialog` in `AuthDialogProvider`,
   `/sign-in`, `/sign-up`) → `startHandoff(path, { flow })`: random `state` →
   `sessionStorage["tcgd:handoff-state"]` → `{apex}/auth/handoff?return={origin}{path}&state=…[&flow=signUp]`.
   Apex/standalone keep the local dialog.
2. Apex `/auth/handoff` (`src/app/auth/handoff`): validates `return` (`parseHandoffReturnUrl`)
   and `state` client-side. Signed out → `/sign-in?next=/auth/handoff?…` (or `/sign-up`). Signed
   in → `authHandoff.create({ returnUrl, state })` → sets the hint cookie →
   `location.replace({returnOrigin}/auth/callback?handoff_code&state&next={path})` — the param is not `code` because Convex Auth consumes `?code=` itself.
   After apex sign-in, `AuthRouteEntry` and the middleware "authenticated on
   `/sign-in|/sign-up|/agent-login`" redirect honor a sanitized same-origin `next`
   (`authenticatedAuthEntryRedirect`), else `/home`.
3. `authHandoff.create` (auth required, rate-limited per user) validates the `returnUrl`
   origin with `isAllowedHandoffOrigin`, stores `sha256(code)` of a 32-byte random code in
   `authHandoffCodes { codeHash, userId, origin, state?, expiresAt, usedAt? }`
   (`by_codeHash`, `by_expiresAt`), TTL 60s. Cron `authHandoff.cleanupExpired` (10 min) deletes
   expired rows in batches of 200 and reschedules itself while a full batch was deleted.
4. Game `/auth/callback`: reads then immediately strips the query (`history.replaceState`),
   checks `state` against sessionStorage (removed either way; login-CSRF guard), calls
   `signIn("handoff", { code, origin: location.origin, state })`, then `router.replace(next)` (sanitized).
   `/auth/*` responses send `Referrer-Policy: no-referrer` (next.config headers + page metadata).
5. `convex/auth.ts` adds `ConvexCredentials({ id: "handoff" })`; `authorize` runs internal
   `authHandoff.consume` (hash match, unused, unexpired, origin match, and — when the code was
   minted with a `state` — exact `state` match, so state is checked server-side as well as against
   sessionStorage; marks `usedAt`, also burns codes presented after expiry or with the wrong
   origin/state. Origin binding is best-effort: `origin` is client-supplied, so it only stops a
   well-behaved client on another host from redeeming the code, not an attacker holding it; failed redemptions are not rate-limited because the only key would be the caller-supplied origin, which would let anyone lock out a game host) and
   returns `{ userId }`.
6. Silent SSO (`src/components/auth/silent-sso.tsx`, mounted in `Providers`): apex sets
   `tcgd_signed_in=1; Domain=.{root}; Path=/; SameSite=Lax; Max-Age=30d[; Secure]`
   (informational only). A game host that is signed out, sees the cookie, and hasn't tried this
   tab session (`sessionStorage["tcgd:sso-tried"]`) marks it tried and redirects to
   `/auth/handoff?...&silent=1`; apex with `silent=1` and no session (or a failed `create`)
   clears the cookie and redirects back with `error=login_required`.
7. Sign out (`useAppSignOut`, both shell call sites): game/apex hosts call
   `authHandoff.signOutEverywhere` (deletes all the user's `authSessions` + their
   `authRefreshTokens`), then `signOut()`, clear `tcgd_signed_in`, and (game hosts) visit
   `{apex}/auth/signed-out?return={origin}/` so the apex clears its cookies too. Standalone:
   local `signOut()` only. Access JWTs already issued stay valid until expiry (~1h) — accepted.
   `/auth/signed-out` is a GET that signs the apex out (logout-CSRF) — accepted, low impact.
8. Sign-up and password reset UIs only render on apex/standalone; game-host `/sign-in` and
   `/sign-up` hand off to the apex (which lands on its own `/sign-in|/sign-up?next=/auth/handoff?...`).
9. `/agent-login` on a game host generates `state`, then redirects to the apex `/agent-login`
   with `next=/auth/handoff?return=...&state=...` (only when `isAgentAuthEnabled()`);
   standalone behaves as today.
10. `@convex-dev/auth` treats only exact `localhost` as local; the postinstall patch and
    `src/lib/auth-local-host.ts` also accept `*.localhost`. The patch marker is a versioned
    comment (`tcgdecks-local-host-vN`); bump it whenever the replacement body changes.

## Rollout / ops (human)

1. Deploy with optional fields.
2. Run migrations in prod: `migrations/migrateDeckSetup:run` and
   `migrations/backfillGameField:runAll` (check each table with
   `migrations/backfillGameField:status '{"table":"cards"}'`, and `migrations/migrateDeckSetup:status`,
   looping on `continueCursor` until `pending` sums to 0). Game-indexed `uvs` lists are empty until
   the backfill finishes, so run it right after the deploy.
3. Publish a catalog **after** the backfill (publishing reads cards `by_game`; writes
   `catalog/{game}/v{n}.json.gz` and the per-game `cardDataVersion` row).
4. **R2 bucket CORS** must allow the new origins: `https://tcgdecks.gg`, `https://*.tcgdecks.gg`,
   and dev `http://*.tcgdecks.localhost:8090` (keep the existing origins). Until then the static
   catalog fetch from R2 fails CORS on the new hosts and the client falls back to the (slower)
   paginated Convex sync.
5. **Vercel domains:** add `tcgdecks.gg` and `*.tcgdecks.gg` (wildcard needs Vercel DNS /
   nameservers); keep `uvsdecks.gg` (+ `www`) attached so middleware can 301 it.
6. **`NEXT_PUBLIC_ROOT_DOMAINS`:** leave unset for the defaults, or set the **same** comma list in
   both Vercel (Next inlines it at build time) and the Convex deployment env
   (`isAllowedHandoffOrigin` reads it server-side). A mismatch breaks the auth handoff.
7. Verify the Resend sender domain.
8. Follow-up change: make `game`/`setup` required (schema fields **and** the public function
   `game` args, which are optional only for rolling-deploy compatibility), drop legacy deck fields,
   old indexes and the legacy-aware lookup fallbacks.
