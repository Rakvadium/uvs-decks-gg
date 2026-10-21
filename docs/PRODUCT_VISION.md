# Product vision — tcg-decks

## Purpose

Deliver a **credible, fast, and shareable** deck-building experience for trading card game players, with **community** surfaces (tier lists, rankings) that remain **explainable** and **moderatable**.

The product is **tcgdecks.gg**: a multi-TCG platform where each game lives on its own subdomain (`uvs.tcgdecks.gg`, later `cyberpunk.tcgdecks.gg`) and the apex (`tcgdecks.gg`) is the game picker and sign-in host.

- **UniVersus first** — UniVersus (`uvs`) is the launch game and the only one shipped today (formerly `uvsdecks.gg`, which now redirects).
- **Cyberpunk TCG next** — the second game module; the game registry, game-scoped data, and host routing exist so it can be added without forking the app.
- **One account across games** — users, teams, and settings are global; decks, collections, tier lists, and card data are scoped to a game. Signing in on the apex signs you in on every game subdomain.

Design and implementation contract: [multi-game.md](./multi-game.md).

## Target users

- **Deck builders** who iterate on lists, sideboards, and references and want reliable card data and search.
- **Collectors** (planned) who want inventory synced to an account — Collection is a placeholder route today.
- **Community participants** who publish tier lists and opt into ranked scopes that feed aggregate views.
- **Team organizers** who coordinate membership, shared decks, and team hub activity.

## Product principles

1. **Card truth in one place** — Canonical card and set data lives in Convex; imports and admin tools keep it consistent.
2. **Explicit community rules** — Ranked versus unranked tier lists, scopes, and aggregation logic stay documented in [features/community/TierListSystem.md](./features/community/TierListSystem.md) and reflected in the UI.
3. **Composable UI** — Features grow as **folder modules** with clear entrypoints ([component-architecture-playbook.md](./component-architecture-playbook.md)); avoid monolithic route files.
4. **Account-bound progress** — Decks, session preferences, and (when shipped) collections belong to authenticated users unless explicitly public.
5. **Game-agnostic core, game modules at the edges** — Shared shell, auth, community, and teams stay game-agnostic; rules, filters, card rendering, deck setup, and theme come from each game's module. Adding a game should not fork a feature.



## Core capabilities (current direction)

- **Deck editor** — Main, side, reference zones; formats; public/private decks; likes and visibility where implemented.
- **Gallery** — Search and filter card catalog; ties to sets and legality fields on cards.
- **Community** — Tier list CRUD, comments/likes, rankings from snapshot tables; creators/media feed as adjacent community surfaces.
- **Teams** — Membership, invites, team hub (announcements/chat/calendar/stats), and team-scoped decks.
- **Admin** — Set/card import and maintenance, formats/legality, user moderation, and community content curation.
- **Collection** (planned) — Placeholder page today; backend schema/API stubs exist, full ownership UX not shipped.



## Non-goals (for now)

- Replacing official tournament software or judge tools.



## Roadmap themes

1. **Multi-game platform** — Ship the tcgdecks.gg host split for UniVersus, then add Cyberpunk TCG as the second game module ([multi-game.md](./multi-game.md)).
2. **Reliability** — Search, deck validation, and edge cases around card faces and variants.
3. **Community trust** — Moderation, abuse resistance, and transparent ranking methodology.
4. **Performance** — Keep list and gallery interactions snappy; cache or snapshot where aggregation is heavy.
5. **Contributor experience** — Documentation and issue queue that make agent and human contributors productive ([`AGENTS.md`](../AGENTS.md)).



## Related documents

- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)
- [multi-game.md](./multi-game.md)
- [features/community/TierListSystem.md](./features/community/TierListSystem.md)
- [component-architecture-playbook.md](./component-architecture-playbook.md)
- [UI_UX_DESIGN.md](./UI_UX_DESIGN.md)

