# Product vision — tcg-decks

## Purpose

Deliver a **credible, fast, and shareable** deck-building experience for UniVersus players, with **community** surfaces (tier lists, rankings) that remain **explainable** and **moderatable**.

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

1. **Reliability** — Search, deck validation, and edge cases around card faces and variants.
2. **Community trust** — Moderation, abuse resistance, and transparent ranking methodology.
3. **Performance** — Keep list and gallery interactions snappy; cache or snapshot where aggregation is heavy.
4. **Contributor experience** — Documentation and issue queue that make agent and human contributors productive ([agent-os.md](./agent-os.md), [agent-onboarding.md](./agent-onboarding.md)).



## Related documents

- [SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)
- [features/community/TierListSystem.md](./features/community/TierListSystem.md)
- [component-architecture-playbook.md](./component-architecture-playbook.md)
- [UI_UX_DESIGN.md](./UI_UX_DESIGN.md)

