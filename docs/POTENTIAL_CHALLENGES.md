# Potential challenges — tcg-decks

## Data complexity

- **Card faces and variants** — Double-faced cards, variants, and oracle linkage need consistent modeling so deck legality and gallery views stay correct.
- **Search quality** — Tiered search indexes must stay populated on import; regressions show up as “missing” discoverability, not always as hard errors.

## Community features

- **Ranking fairness** — Aggregate rankings depend on clear scope rules and contributor limits; see [community-tier-list-system.md](./community-tier-list-system.md).
- **Moderation** — Comments and public lists need workflows for abuse and spam as usage grows.

## Operational

- **Import pipelines** — Bulk card uploads and scripts can stress rate limits or storage; batching and idempotency matter.
- **Cost visibility** — Convex, storage, and email usage should be monitored as traffic grows.

## Engineering

- **Large UI files** — Without disciplined splits ([component-architecture-playbook.md](./component-architecture-playbook.md), [CODE_SIZE_POLICY.md](./CODE_SIZE_POLICY.md)), route and dialog components can become hard to change safely.
- **Auth boundaries** — Every Convex write path must assert the correct user or role; omissions are security bugs, not polish issues.
