# Multi-game platform (Phases 1–2)

The app is becoming **tcgdecks.gg**: one account, many TCGs, each game on its own subdomain
(`uvs.tcgdecks.gg`, later `cyberpunk.tcgdecks.gg`). UniVersus (`uvs`) is the only game shipped
in Phases 1–2; Cyberpunk TCG is Phase 3.

This doc is the design contract. Implementers follow it; if code evidence forces a change,
update this doc in the same change.

## Vocabulary

- **GameId** — string id of a game. `GAME_IDS = ["uvs"] as const`, `DEFAULT_GAME_ID = "uvs"`.
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
| `shared/hosts.ts` | Host → `{ kind: "game" \| "apex" \| "standalone", game }` resolution and cross-host URL builders | middleware, src, convex |
| `src/games/types.ts` | `ClientGameModule` (extends shared module with React components/hooks) | src |
| `src/games/registry.ts` | `CLIENT_GAME_MODULES`, `getClientGameModule(id)` | src |
| `src/games/uvs/**` | UVS React components (card rendering, character picker, stat filter inputs, …) | src |
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

## Deck setup (replaces `startingCharacterId` / `selectedIdentity`)

```ts
// convex/validators.ts
export const uvsDeckSetupValidator = v.object({
  game: v.literal("uvs"),
  startingCharacterId: v.optional(v.id("cards")),
  selectedIdentity: v.optional(v.string()),
});
export const deckSetupValidator = uvsDeckSetupValidator; // becomes v.union(...) in Phase 3
```

- `decks.setup: v.optional(deckSetupValidator)`.
- Legacy top-level `startingCharacterId` / `selectedIdentity` stay in the schema as
  **deprecated optional** fields until the backfill has run in production. Writers only write
  `setup` (and clear the legacy fields when they patch). Readers go through one normalizer:
  `normalizeDeckSetup(deck)` in `shared/games/uvs/setup.ts`, which prefers `setup` and falls
  back to the legacy fields.
- Mutation API: `decks.create` / `decks.update` accept `setup` (update: `setup: v.optional(v.union(deckSetupValidator, v.null()))`
  keeps today's null-clears semantics per field via a partial-setup patch helper).
- Backfill: `convex/migrations/migrateDeckSetup.ts`.

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
- Public queries/mutations over game-scoped data take `game: gameIdValidator` (required).
  Global ones (users, teams, settings) don't.
- `sessions` (per user) moves game-specific UI state into `gameState: v.optional(v.record(v.string(), v.object({ activeDeckId?, galleryFilters?, rightSidebarAction? })))`
  keyed by GameId, falling back to the legacy top-level fields for `uvs`.
- Backfill: `convex/migrations/backfillGameField.ts` — **paginated** (`.paginate()` + scheduler
  self-rescheduling, one table per invocation), idempotent, returns counts. Existing migrations
  `collect()` whole tables; do not copy that for `cards`/`decks`.

## Catalog, storage keys

- R2 catalog: `catalog/{game}/v{n}.json.gz` (`catalogObjectKeyForVersion(game, version)`).
  The `cardDataVersion` row stores the full object key, so old `catalog/v{n}` rows keep working
  until the next publish. Cleanup deletes per game.
- Card images stay under `cards/` (keys are already set-code based).
- IndexedDB: `tcgdecks-{game}-cards`, `tcgdecks-{game}-sets`. Old `universus-*` DBs are
  ignored (catalog re-downloads once) and deleted best-effort.
- localStorage: `tcgdecks:{game}:{key}` for game-scoped UI state, `tcgdecks:{key}` for global.
  On first read, fall back to the legacy `uvs-decks-*` key (for `uvs` only) and migrate it.

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
- Next 16 deprecates `src/middleware.ts` in favor of `proxy.ts`; the routing step may rename it.

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

## Central auth host (handoff)

Convex Auth cookies are per-host and its Next.js middleware can't set a cookie `Domain`, so
subdomains get their own sessions via a one-time handoff from the apex.

1. Game host, signed out, user clicks Sign in → generate `state` (store in `sessionStorage`) →
   navigate to `{apex}/auth/handoff?return={origin}{path}&state={state}`.
2. Apex `/auth/handoff`: if signed out → `/sign-in?next=/auth/handoff?...`. If signed in →
   mutation `authHandoff.create({ returnUrl, state })` → redirect
   `{returnOrigin}/auth/callback?code&state&next={path}`.
3. `authHandoff.create` validates `returnUrl` origin with `isAllowedHandoffOrigin` from
   `shared/hosts.ts` (`https://{game}.tcgdecks.gg`, dev `http://{game}.tcgdecks.localhost:8090`),
   stores `sha256(code)` in `authHandoffCodes { codeHash, userId, origin, expiresAt, usedAt? }`
   (`by_codeHash`), TTL 60s. A cron/cleanup removes expired rows.
4. Game `/auth/callback`: check `state` against sessionStorage, strip query from the URL
   (`history.replaceState`), call `signIn("handoff", { code, origin: location.origin })`,
   then `router.replace(next)`.
5. `convex/auth.ts` adds `ConvexCredentials({ id: "handoff", authorize })`; `authorize` runs
   an internal mutation that consumes the code (hash match, not used, not expired, origin match)
   and returns `{ userId }`.
6. Silent SSO: after apex sign-in, set cookie `tcgd_signed_in=1; Domain=.{root}; Path=/; SameSite=Lax`
   (informational only). A game host that is signed out, sees the cookie, and hasn't tried this
   tab session (`sessionStorage`) redirects to `/auth/handoff?...&silent=1`; apex with `silent=1`
   and no session redirects back with `error=login_required` and clears the cookie.
7. Sign out everywhere: mutation `authSessions.signOutEverywhere` deletes all of the user's
   `authSessions` + `authRefreshTokens`; client then calls `signOut()`, clears `tcgd_signed_in`,
   and (on game hosts) visits `{apex}/auth/signed-out` so the apex clears its cookies too.
   Access JWTs already issued stay valid until expiry (~1h) — accepted.
8. Sign-up and password reset UIs only render on apex/standalone; game-host `/sign-in` and
   `/sign-up` redirect to the apex with `next=/auth/handoff?...`.
9. `/agent-login` on a game host redirects to the apex `/agent-login` with
   `next=/auth/handoff?return=...`; standalone behaves as today.
10. `@convex-dev/auth` treats only exact `localhost` as local; the postinstall patch and
    `src/lib/auth-local-host.ts` also accept `*.localhost`. The patch marker is a versioned
    comment (`tcgdecks-local-host-vN`); bump it whenever the replacement body changes.

## Rollout / ops (human)

1. Deploy with optional fields. 2. Run `migrations/migrateDeckSetup:run` and
`migrations/backfillGameField:runAll` in prod. 3. Publish a catalog (writes the per-game key).
4. DNS: `tcgdecks.gg`, `*.tcgdecks.gg` on Vercel; `uvsdecks.gg` stays attached for the
redirect. 5. Verify the Resend sender domain. 6. Follow-up change: make `game`/`setup`
required, drop legacy deck fields and old indexes.
