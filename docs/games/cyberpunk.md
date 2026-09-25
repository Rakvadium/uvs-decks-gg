# Cyberpunk TCG (Phase 3)

Second game on the platform (`GameId` `"cyberpunk"`, host `cyberpunk.tcgdecks.gg`, dev
`cyberpunk.tcgdecks.localhost:8090`). Platform contracts live in [../multi-game.md](../multi-game.md);
this doc is the game-specific contract. Update it in the same change if code evidence forces a change.

Status: **wave A done** (shared module + Convex foundation). Wave B (React UI) replaces the
placeholder client module `src/games/cyberpunk/index.ts`, which reuses the UVS `ui` for now
(`TODO(phase3-ui)`).

## Module (`shared/games/cyberpunk/**`)

| File | Contents |
| --- | --- |
| `index.ts` | `CYBERPUNK_SHARED_GAME_MODULE`: display name "Cyberpunk TCG", short "CPK", theme (primary yellow `55 98% 51%`, secondary cyan `184 100% 50%`, accent red `350 90% 55%`), brand `["TCG","DECKS",".GG"]` / "Cyberpunk TCG · TCGDECKS.GG" |
| `setup.ts` | Setup types, `normalizeCyberpunkSetup`, `applyCyberpunkSetupPatch`, `cyberpunkSetupCardIds`, `cyberpunkSetupPreviewCardId`, `CYBERPUNK_LEGEND_COUNT = 3` |
| `rules/standard.ts`, `rules/index.ts` | `planCyberpunk` / `validateCyberpunk` (one ruleset for every format key), `cyberpunkRamBudget`, `cyberpunkCopyGroupKey` |
| `card-types.ts` | Type order `Unit, Gear, Program`, labels (incl. `Legend: "Legends"`), colors + labels + swatches, `isCyberpunkLegendType`, `normalizeCyberpunkColor` |
| `card-eligibility.ts` | `canAddCyberpunkCardToDeck`, `getCyberpunkCardCopyLimit`, `CYBERPUNK_DEFAULT_COPY_LIMIT = 3` |
| `deck-text.ts` | `parseCyberpunkDeckText` / `formatCyberpunkDeckText` |
| `filters.ts` | `CYBERPUNK_FILTER_DEFINITION` |
| `formats.ts` | `CYBERPUNK_DEFAULT_FORMATS` (seeded by `admin.seedFormats({ game: "cyberpunk" })`) |
| `deck.ts` | `CYBERPUNK_DECK_MODULE` (`sideboardLimit 0`, `simulatorHandSize` 6, no zones) |

Generic rule helpers shared by both games live in `shared/games/rules-common.ts`
(`shared/games/uvs/rules/common.ts` re-exports them).

## Rules we encode

Sources: official site (cyberpunktcg.com), community guides. Deck construction:

- Exactly **3 Legends**, all with **different names** (case-insensitive). Legends are not part of the
  deck count.
- **40–50** main-deck cards (excluding Legends), from the format's `minDeckSize`/`maxDeckSize`. No
  sideboard (`sideboardRule "max:0"`).
- At most **3 copies** of a card (`format.defaultCopyLimit`), grouped by `oracleId`, falling back to
  the (trimmed, case-insensitive) name. `card.copyLimit` overrides the default per printing — it may
  raise or lower it, `null` is unlimited; a group uses its strictest printing
  (`strictestPrintingCopyLimit`). Note: UVS standard caps overrides at the format default
  (`groupEffectiveCopyLimit`, unchanged).
- No Legends in the main deck; main-deck cards need a type.
- **Colors:** `red`, `green`, `blue`, `yellow` (compared case-insensitively, so official `"Red"` works;
  importers should store lowercase). Each Legend has a color and a RAM value. For each color, the
  valid Legends' total RAM of that color is the budget: every main-deck card of that color must have
  `ram <= budget[color]` (missing `ram` = 0). A card of a color with budget 0 is illegal. Colorless
  cards (no `color`) skip the check.
- Banned / restricted use the shared `cardLegality` rows like UVS: banned per printing (main, side
  and Legends); restricted caps a copy group at the strictest `copyLimitOverride` (default 1).
- Card types: `Legend`, `Unit`, `Gear`, `Program`. Deck list groups: Unit, Gear, Program.
- Opening hand: **6** cards (draw simulator).
- Format: one format, key `standard` (`minDeckSize 40`, `maxDeckSize 50`, `defaultCopyLimit 3`,
  `sideboardRule "max:0"`, UVS-only flags `requiresStartingCharacter/requiresIdentity` false and
  ignored by this module). `seedFormats` re-syncs `maxDeckSize` on an existing `standard` row only
  for games that define one.

Error codes: `WRONG_LEGEND_COUNT`, `LEGEND_NOT_FOUND`, `INVALID_LEGEND_TYPE`,
`DUPLICATE_LEGEND_NAME`, `DECK_TOO_SMALL`, `DECK_TOO_LARGE`, `SIDEBOARD_TOO_LARGE`,
`LEGEND_IN_MAIN_DECK`, `MAIN_CARD_MISSING_TYPE`, `COLOR_NOT_PROVIDED`, `RAM_EXCEEDS_BUDGET`,
`BANNED_CARD`, `EXCEEDS_COPY_LIMIT`, `EXCEEDS_RESTRICTED_LIMIT`. Warning: `LEGEND_MISSING_COLOR`.

Client eligibility (`isMainDeckEligible`): any card with a type other than Legend. Legends are only
added through the setup. `getCardCopyLimit`: `copyLimit` when positive, unlimited for `null`/`<= 0`,
else 3.

## Card data model

Cyberpunk cards live in the shared `cards` table with `game: "cyberpunk"`, reusing generic columns
(`name`, `type`, `text`, `keywords` (pipe-delimited), `rarity`, `setCode`, `setName`,
`collectorNumber`, `imageUrl`, `oracleId`, `copyLimit`, search fields) and adding optional flat columns
(schema, `cardValidator`, `cardInputValidator`, `cardDraftEditableValidator`, `admin.updateCard`,
admin JSON editor, `upsertCardsBatch` + its HTTP endpoint, import sanitizer, draft approval):

| Column | Type | Meaning |
| --- | --- | --- |
| `color` | string (`red` \| `green` \| `blue` \| `yellow`) | Card color; for Legends, the RAM color they provide |
| `cost` | number | Eddie cost (top-left) |
| `power` | number | Power (PWR); Units/Legends/Gear |
| `ram` | number | RAM requirement (cards) / RAM provided (Legends) |
| `sellable` | boolean | Has the Eddie symbol (official `is_eddiable`) |
| `tags` | string, pipe-delimited | Classifications (e.g. `Arasaka|Corpo`) |
| `subname` | string | Card subtitle (e.g. a Legend's epithet) |
| `artist` | string | Illustrator |

UVS never sets these; UVS columns stay untouched. The static catalog publishes whole card docs, so
the new columns ship in `catalog/cyberpunk/v{n}.json.gz` automatically.

Search (`deriveCardSearchFields`): `subname` (after the name) and `tags` (as words, next to keywords)
join `searchText`; `color` joins `searchAll`. Each is only added when present, so UVS search strings
are byte-for-byte unchanged.

## Deck setup

```ts
{ game: "cyberpunk", legendIds: Id<"cards">[] }   // ordered, max 3; legendIds[0] = preview art
patch: { game: "cyberpunk", legendIds?: Id<"cards">[] | null }   // omitted keeps, null clears, array replaces
```

- Validators: `cyberpunkDeckSetupValidator` / `cyberpunkDeckSetupPatchValidator`;
  `deckSetupValidator = v.union(uvs, cyberpunk)`, `deckSetupPatchValidator = v.union(uvsPatch, cyberpunkPatch)`.
- `applySetupPatch` throws on more than 3 Legends or a repeated id (Legend type / name rules are
  deck validation, not write checks).
- `decks.create` / `decks.update` resolve args with `resolveDeckSetupPatchArgs(game, setup, legacy)`
  (`shared/games/deck-setup.ts`): a setup tagged for another game throws; the deprecated
  `startingCharacterId` / `selectedIdentity` args are folded in for UVS and rejected for Cyberpunk.
  Legend ids go through the same back-face / same-game checks as the UVS starting character.
- Deck preview art (decks list, hero, active deck icon, simulator) uses the module's
  `setupPreviewCardId(setup)` (UVS: starting character; Cyberpunk: first Legend);
  `deckSetupPreviewCardId(setup)` dispatches on `setup.game`.

## Deck text format

Export (`formatCyberpunkDeckText`, params get `setupCards` = Legends in setup order):

```
Legends
1 V, Streetkid
1 ...

Deck
3 Mantis Blades
...
```

Deck entries: Unit, Gear, Program, then any other type; by name within a type. A `Sideboard` section
is only written when the side has cards (legacy data; the format allows none).

Import is lenient: `3 Name`, `3x Name`, `Name x3` / `Name x 3`; section headings `Legends`,
`Deck` / `Main` / `Main Deck`, `Side` / `Sideboard` (also `[b]…[/b]`, leading `#`, trailing `:` or a
count like `Legends (3)`); unknown headings / non-card lines are ignored (lines stay in the current
section); lines before any heading are main deck. `ParsedDeckText.setupCards` holds the Legends
(`character` is always `null`).

## Gallery filters

`GameFilterDefinition.facets` (new, both games) declares which facet pickers the gallery shows:
`{ symbols, zones, keywords, uvsCardFlags, colors?, tags }` (type / rarity / set always show).

- UVS: `{ symbols: true, zones: true, keywords: true, uvsCardFlags: true, tags: false }` (today's UI).
- Cyberpunk: stats `cost`, `power`, `ram` (one "Stats" group; range + operator like UVS, sortable);
  no zones; facets `colors` (4 options with swatches) and `tags`; UVS symbols / zones / keywords /
  card flags hidden.

## Card data source

Card data is imported from the official site's card database (cyberpunktcg.com/cards embeds
structured card records) via `scripts/import-cyberpunk-official.ts` (separate importer). Mapping:
`card_type` → `type` (`Legend` / `Unit` / `Gear` / `Program`), color → `color` (lowercase),
`is_eddiable` → `sellable`, `classifications` → `tags` (pipe-delimited), `rules_text` → `text`,
plus `cost`, `power`, `ram`, `keywords`, `rarity`, set, collector number, `subname`, `artist`.
It writes through the admin HTTP API (`upsert-set`, `upsert-cards-batch` with `game: "cyberpunk"`,
then `rebuild-catalog-aggregates` with `{ "game": "cyberpunk" }`). Seed the format first with
`admin.seedFormats({ game: "cyberpunk" })`. There is no placeholder fixture set.

## Open items for wave B (UI)

- Real `ui` for `src/games/cyberpunk` (text-frame card rendering when there is no image, Legend
  picker for 3 slots, color/tag facet pickers reading `filters.facets`, cost/power/RAM stats,
  deck stats palette).
- UVS-only setup UI still renders for every game via `uvsSetupFields(...)` (hero panel, active deck
  character panel, import/export) — replace with per-game setup UI.
- Import/export UI must pass `setupCards` (Legends) to `text.format` and read `parsed.setupCards`.
- `CardFilters` / URL state / `sessions.galleryFilters` only know UVS keys; add `color`, `tags`,
  `cost`/`power`/`ram` stat keys.
- Admin card form / draft review don't expose the new columns yet.
