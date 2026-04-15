# Project overview — tcg-decks (uvs-decks-gg)

The **canonical product definition** is **[PRODUCT_VISION.md](./PRODUCT_VISION.md)**. The **canonical runtime picture** is **[SYSTEM_ANALYSIS.md](./SYSTEM_ANALYSIS.md)**. If anything here disagrees with those files, **they win**.

## What it is

A web application for building and sharing **UniVersus-style** decks, browsing a **card gallery**, tracking a **collection**, and participating in **community tier lists** and **aggregate rankings**. Authentication and realtime data use **Convex**; the client is **Next.js** (App Router).

## Problems it addresses

- Deck builders need fast search, legality-aware lists, and layouts that match how players think about piles and references.
- Players want a **collection** tied to accounts and a **gallery** tuned for discovery.
- Community features need **fair aggregation** and clear rules for ranked versus casual lists (see [community-tier-list-system.md](./community-tier-list-system.md)).

## Technical orientation

- **UI composition:** Follow **[component-architecture-playbook.md](./component-architecture-playbook.md)** for non-trivial features (feature folders, `content.tsx`, `hook.ts`, stable wrapper exports).
- **Stack detail:** [TECH_STACK_DETAILS.md](./TECH_STACK_DETAILS.md)
- **Deploy:** [DEPLOYMENT.md](./DEPLOYMENT.md)