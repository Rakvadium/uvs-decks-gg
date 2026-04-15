# Product vision — tcg-decks

## Purpose

Deliver a **credible, fast, and shareable** deck-building experience for UniVersus players, with **community** surfaces (tier lists, rankings) that remain **explainable** and **moderatable**.

## Target users

- **Deck builders** who iterate on lists, sideboards, and references and want reliable card data and search.
- **Collectors** who want inventory synced to an account.
- **Community participants** who publish tier lists and opt into ranked scopes that feed aggregate views.

## Product principles

1. **Card truth in one place** — Canonical card and set data lives in Convex; imports and admin tools keep it consistent.
2. **Explicit community rules** — Ranked versus unranked tier lists, scopes, and aggregation logic are documented ([community-tier-list-system.md](./community-tier-list-system.md)) and reflected in the UI.
3. **Composable UI** — Features grow as **folder modules** with clear entrypoints ([component-architecture-playbook.md](./component-architecture-playbook.md)); avoid monolithic route files.
4. **Account-bound progress** — Decks, collections, and session preferences belong to authenticated users unless explicitly public.

## Core capabilities (current direction)

- **Deck editor** — Main, side, reference zones; formats; public/private decks; likes and visibility where implemented.
- **Gallery** — Search and filter card catalog; ties to sets and legality fields on cards.
- **Collection** — Per-user quantities and card ownership tracking.
- **Community** — Tier list CRUD, comments/likes where enabled, rankings pages driven by snapshot and ranking tables.
- **Admin** — Imports and set/card maintenance for operators.

## Non-goals (for now)

- Replacing official tournament software or judge tools.
- Full social graph or messaging (unless added explicitly later).

## Roadmap themes

1. **Reliability** — Search, deck validation, and edge cases around card faces and variants.
2. **Community trust** — Moderation, abuse resistance, and transparent ranking methodology.
3. **Performance** — Keep list and gallery interactions snappy; cache or snapshot where aggregation is heavy.
4. **Contributor experience** — Documentation and backlog that make agent and human contributors productive ([BACKLOG.md](./BACKLOG.md), [agent-onboarding.md](./agent-onboarding.md)).

## Related documents

- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)
- [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md)
- [POTENTIAL_CHALLENGES.md](./POTENTIAL_CHALLENGES.md)

