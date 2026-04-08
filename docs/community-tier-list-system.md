# Community Tier List System

This document explains how the Community tier-list system currently works across the frontend, Convex backend, and ranking aggregation layer.

It is intended to be the source of truth for:

- how tier lists are created and edited
- which lists contribute to rankings
- how ranked lanes are standardized
- how community statistics are generated
- where the implementation lives in the codebase

## Goals

- Let users create flexible personal tier lists for fun.
- Let users opt into structured ranked lists that can be compared fairly.
- Keep ranking logic deterministic and easy to tune.
- Prevent a single user from over-influencing aggregate rankings with many lists in the same scope.
- Cache ranking outputs so the Community rankings page is fast to render.

## High-Level Model

The system supports two major tier-list modes:

- `unranked`
  - fully custom
  - does not contribute to community rankings
- `ranked`
  - contributes to one explicit ranking scope
  - uses fixed lanes only

Ranking scope is stored on each tier list with:

- `unranked`
- `global`
- `set_scope`

Only `global` and `set_scope` are ranking-eligible. `unranked` is intentionally excluded from all aggregates.

## Why Ranked and Unranked Are Separate

Community ranking needs comparability. If users could freely choose:

- lane count
- lane names
- lane order meaning

then two lists would not be meaningfully comparable.

To solve that, the system separates:

- fun lists with full flexibility
- ranked lists with fixed structure

This keeps the editor expressive while still making aggregate statistics defensible.

## Ranked Lane Standard

Ranked lists always use exactly 6 lanes:

1. `S`
2. `A`
3. `B`
4. `C`
5. `D`
6. `F`

These are defined centrally in [shared/app-config.ts](C:/Projects/uvs-decks-gg/shared/app-config.ts).

Current canonical ranked lane IDs and colors:

- `tier-s`
- `tier-a`
- `tier-b`
- `tier-c`
- `tier-d`
- `tier-f`

Ranked lists:

- cannot add lanes
- cannot remove lanes
- cannot rename lanes
- cannot recolor lanes
- cannot reorder lanes

Unranked lists remain flexible:

- add/remove lanes
- custom labels
- custom colors

## Shared Configuration

All ranking constants live in [shared/app-config.ts](C:/Projects/uvs-decks-gg/shared/app-config.ts).

Current settings:

- `rankedTierCount = 6`
- `rankedTierDefinitions = S/A/B/C/D/F`
- `laneWeightGamma = 2`
- `minimumVotesToRank = 5`
- `smoothingK = 8`
- `smoothingPriorMean = 0.5`

Generated community tier thresholds:

- `S >= 0.85`
- `A >= 0.70`
- `B >= 0.55`
- `C >= 0.40`
- `D < 0.40`

This file is intentionally shared by frontend and Convex so the ranking system does not drift across layers.

## Ranking Scopes

The system supports three saved scope values:

### `unranked`

Use this for personal, experimental, or silly tier lists.

Behavior:

- creates a fully flexible tier list
- does not contribute to community rankings
- does not need to match the ranked lane standard

### `global`

Use this when a user wants their ranked list to count toward the overall community leaderboard.

Behavior:

- uses the fixed `S-F` lane structure
- contributes only to the global ranking
- does not also contribute to set-scoped rankings

### `set_scope`

Use this when a user wants their ranked list to count only for a specific selected card pool.

Behavior:

- uses the fixed `S-F` lane structure
- contributes only to an exact selected-set signature
- does not contribute to the global ranking

## Scope Keys

Set-scoped rankings are keyed by a normalized signature of selected set codes.

Normalization rules:

- trim whitespace
- remove duplicates
- sort codes alphabetically
- join with `__`

This means equivalent set selections produce the same scope key even if the user selected them in a different order.

Helpers live in [shared/app-config.ts](C:/Projects/uvs-decks-gg/shared/app-config.ts):

- `normalizeScopeSetCodes`
- `normalizeSetScopeKey`
- `resolveRankingScopeKey`

## Data Model

Tier lists are stored in Convex and now include:

- `rankingScope`
- `rankingScopeKey`

These fields live in the `tierLists` table schema in [convex/schema.ts](C:/Projects/uvs-decks-gg/convex/schema.ts).

Additional ranking cache tables:

- `communityCardRankings`
- `communityTierSnapshots`

These tables store:

- per-card aggregated ranking stats
- generated community tier placements for a scope

Important indexes were added so ranked scopes can be recomputed efficiently:

- by public + ranking scope + updated time
- by public + ranking scope + scope key + updated time
- by snapshot scope
- by card ranking scope and adjusted score

## Frontend Architecture

The Community tier-list feature is organized into modular feature folders under:

- [src/components/community/tier-lists/](C:/Projects/uvs-decks-gg/src/components/community/tier-lists)

Important areas:

- browser/create flow
  - [page-view/hook.ts](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/page-view/hook.ts)
  - [page-view/create-dialog.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/page-view/create-dialog.tsx)
- detail/editor flow
  - [detail-view/hook.ts](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/hook.ts)
  - [detail-view/top-bar.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/top-bar.tsx)
  - [detail-view/board.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/board.tsx)
  - [detail-view/lane-row.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/lane-row.tsx)
- feed/browser cards
  - [feed/content.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/feed/content.tsx)
  - [feed/card.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/feed/card.tsx)
  - [page-view/browser-card.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/page-view/browser-card.tsx)

Community rankings view:

- exposed inside the `Rankings` tab on [src/app/(app)/community/tier-lists/page.tsx](C:/Projects/uvs-decks-gg/src/app/(app)/community/tier-lists/page.tsx)
- rendered by [src/components/community/community-rankings-view.tsx](C:/Projects/uvs-decks-gg/src/components/community/community-rankings-view.tsx)
- the legacy [src/app/(app)/community/rankings/page.tsx](C:/Projects/uvs-decks-gg/src/app/(app)/community/rankings/page.tsx) route now redirects into the merged tier-list experience

## Create Flow

Users create a tier list from the tier-list browser dialog.

The create dialog lives in [create-dialog.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/page-view/create-dialog.tsx) and presents three options:

- `Fun / Unranked`
- `Global Ranked`
- `Set-Scoped Ranked`

Behavior at creation time:

- `unranked`
  - creates a flexible list with default editable tiers
- `global`
  - creates a fixed canonical ranked list
- `set_scope`
  - creates a fixed canonical ranked list

New lists start private. A ranked list only affects aggregates after it is public and otherwise eligible.

## Detail Editor Behavior

The detail model lives in [detail-view/hook.ts](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/hook.ts).

It manages:

- title
- description
- publicity
- ranking scope
- selected sets
- tiers
- lane map
- autosave-on-drop behavior
- presentation mode

### Ranked detail behavior

When the current scope is ranked:

- tier labels are not editable
- tier colors are not editable
- add-tier is disabled
- remove-tier is disabled

### Unranked detail behavior

When the current scope is unranked:

- tier labels are editable
- tier colors are editable
- add-tier is enabled
- remove-tier is enabled

### Switching scopes

Users can change scope from the detail top bar in [detail-view/top-bar.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/top-bar.tsx).

Scope changes follow these rules:

- unranked -> ranked
  - if the current lanes are not already canonical, the UI asks for confirmation
  - the list is reset to canonical ranked lanes
  - previously placed custom-lane cards are reconciled back through the lane-map logic
- ranked -> unranked
  - the list becomes flexible again from that point forward

The confirmation step exists to prevent accidental destruction of a custom lane structure.

## Card Pool and Lane Placement

Cards are selected by set codes. The selected card pool is derived in [detail-view/hook.ts](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/hook.ts) by filtering the cached card catalog.

Important rules:

- the `pool` lane represents unranked cards
- cards left in `pool` do not contribute to aggregate scoring
- dragging a card into a ranked lane updates the lane map
- card drops auto-save the latest draft state

Presentation mode is a UI workflow enhancement for ranking one card at a time, but it does not change scoring semantics. It still feeds the same lane-map model.

## Save Semantics

Saving happens through [convex/tierLists.ts](C:/Projects/uvs-decks-gg/convex/tierLists.ts).

Important save behavior:

- titles and descriptions are sanitized
- selected sets are normalized
- ranked lists are canonicalized to the fixed `S-F` lanes
- invalid lane keys are normalized back to `pool`
- duplicate card placements are deduped
- preview cards and featured cards are recalculated

When a ranked scope is saved, the backend also determines which aggregate scopes need recomputation.

## Eligibility Rules for Rankings

A list contributes to ranking only when all required conditions are met.

Current eligibility rules:

- `isPublic === true`
- `rankingScope !== "unranked"`
- tiers match the canonical ranked definition exactly
- for `set_scope`, the list must have at least one selected set

If any of these conditions fail, the list is excluded from ranking aggregation.

## Anti-Abuse Rule

The ranking system only counts one eligible public list per user per scope.

The implementation lives in [convex/communityRankings.ts](C:/Projects/uvs-decks-gg/convex/communityRankings.ts).

Rule:

- latest eligible list wins

This means a single user cannot create many public lists in the same scope and have all of them counted.

Examples:

- one user can have one counted global ranked list
- one user can have one counted ranked list for each exact set-scope signature
- many unranked lists are allowed, but they never contribute

## Lane Weighting

Ranked lists use deterministic lane weighting derived from lane position.

Formula:

```ts
base = 1 - laneIndex / (laneCount - 1)
laneScore = base ^ gamma
```

With the current ranked setup:

- `laneCount = 6`
- `gamma = 2`

Resulting weights:

1. `S = 1.00`
2. `A = 0.64`
3. `B = 0.36`
4. `C = 0.16`
5. `D = 0.04`
6. `F = 0.00`

This model intentionally emphasizes upper-lane separation more than a linear scale would.

## Aggregate Statistics

Aggregate computation lives in [convex/communityRankings.ts](C:/Projects/uvs-decks-gg/convex/communityRankings.ts).

For each eligible scope:

1. Find all eligible public lists in that scope.
2. Deduplicate to the latest list per user.
3. Load ranked card placements.
4. Ignore `pool`.
5. Convert lane placement to lane weight.
6. Aggregate per card.

Per-card accumulator tracks:

- `voteCount`
- `sumScore`
- `topLaneCount`
- `bottomLaneCount`

Derived stats:

- `rawMeanScore`
- `adjustedScore`
- `topLaneRate`
- `bottomLaneRate`

## Bayesian Smoothing

Leaderboard ordering uses a smoothed score rather than raw average.

Formula:

```ts
adjustedScore =
  (n / (n + k)) * rawMean +
  (k / (n + k)) * priorMean
```

Current defaults:

- `n = voteCount`
- `k = 8`
- `priorMean = 0.5`

Why this matters:

- a card with 1 perfect vote should not outrank a card with many strong votes
- low-sample outliers are pulled toward the prior
- confidence grows as vote count increases

## Minimum Vote Threshold

Cards are stored in aggregate stats even when they have very few votes, but they are not surfaced in the ranked leaderboard until they reach a minimum sample size.

Current rule:

- `minimumVotesToRank = 5`

Below threshold:

- cards are shown as insufficient data
- cards are excluded from the ranked leaderboard
- cards are excluded from the generated community tier list

## Generated Community Tier List

After card-level adjusted scores are computed, the backend creates a generated community tier list snapshot.

This snapshot is grouped using fixed thresholds:

- `S >= 0.85`
- `A >= 0.70`
- `B >= 0.55`
- `C >= 0.40`
- `D < 0.40`

This is not based on quantiles. It is based on absolute score thresholds so the resulting tier boundaries remain stable over time.

Snapshots are stored in:

- `communityTierSnapshots`

These snapshots power the Community rankings page without needing to recompute the full ranking tree on every request.

## Community Rankings View

The rankings UI lives in [community-rankings-view.tsx](C:/Projects/uvs-decks-gg/src/components/community/community-rankings-view.tsx).

In the app shell, it is presented as the `Rankings` tab within the tier-list browser page so users can browse lists and inspect aggregate stats in one place.

Current capabilities:

- view `global` rankings
- view `set_scope` rankings
- choose from available set scopes
- inspect summary counts
- inspect the generated community tier list
- inspect ranked leaderboard rows
- inspect insufficient-data cards

The page relies on:

- `api.communityRankings.listSetScopes`
- `api.communityRankings.getScopeLeaderboard`

## Scope Labels in the UI

Tier-list cards and detail views surface scope in user-facing labels:

- `Fun / Unranked`
- `Global Ranked`
- `Set-Scoped Ranked`

These labels are resolved from shared config helpers so the terminology stays consistent across:

- create dialog
- detail top bar
- tier-list cards
- feed cards
- rankings page

## Current Limitations

The current implementation is intentionally opinionated and v1-oriented.

Known limitations:

- ranked lanes are fixed to `S-F`; alternate ranked templates are not supported
- set-scope ranking is based only on exact selected-set signatures
- rankings are recomputed from source lists instead of incrementally patched
- unranked lists do not currently preserve a historical pre-conversion lane template when switching from ranked back to unranked
- the statistics page is intentionally lightweight and does not yet include historical trends, card drill-down pages, or format-aware scopes

## Tuning Guidance

If ranking behavior needs to change, start in [shared/app-config.ts](C:/Projects/uvs-decks-gg/shared/app-config.ts), not in feature code.

Primary tuning knobs:

- `laneWeightGamma`
- `minimumVotesToRank`
- `smoothingK`
- `smoothingPriorMean`
- generated community tier thresholds

Suggested rule:

- change constants first
- only change aggregation logic when the math model itself needs to evolve

## Files to Know

Configuration:

- [shared/app-config.ts](C:/Projects/uvs-decks-gg/shared/app-config.ts)

Convex:

- [convex/schema.ts](C:/Projects/uvs-decks-gg/convex/schema.ts)
- [convex/validators.ts](C:/Projects/uvs-decks-gg/convex/validators.ts)
- [convex/tierLists.ts](C:/Projects/uvs-decks-gg/convex/tierLists.ts)
- [convex/communityRankings.ts](C:/Projects/uvs-decks-gg/convex/communityRankings.ts)

Community browser/create:

- [src/components/community/tier-lists/page-view/hook.ts](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/page-view/hook.ts)
- [src/components/community/tier-lists/page-view/create-dialog.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/page-view/create-dialog.tsx)
- [src/components/community/tier-lists/page-view/top-bar.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/page-view/top-bar.tsx)

Community detail/editor:

- [src/components/community/tier-lists/detail-view/hook.ts](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/hook.ts)
- [src/components/community/tier-lists/detail-view/top-bar.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/top-bar.tsx)
- [src/components/community/tier-lists/detail-view/board.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/board.tsx)
- [src/components/community/tier-lists/detail-view/lane-row.tsx](C:/Projects/uvs-decks-gg/src/components/community/tier-lists/detail-view/lane-row.tsx)

Rankings UI:

- [src/app/(app)/community/tier-lists/page.tsx](C:/Projects/uvs-decks-gg/src/app/(app)/community/tier-lists/page.tsx)
- [src/components/community/community-rankings-view.tsx](C:/Projects/uvs-decks-gg/src/components/community/community-rankings-view.tsx)

## Future Extensions

Natural next steps if the system grows:

- per-card drill-down pages
- historical trend tracking
- explicit format-aware scopes
- admin recompute tools
- richer “why this card is ranked here” explanations
- contributor breakdowns by scope

For now, the system is optimized for:

- clear user intent
- consistent ranking semantics
- practical abuse resistance
- easy tuning from one shared config surface
