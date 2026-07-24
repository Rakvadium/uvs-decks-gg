# Floating header islands

Desktop pages use a floating "island" header: pill-shaped capsules overlaid on the top of the scroll area instead of a solid chrome bar. This doc defines the slot semantics every page must follow so headers stay predictable as the app grows.

**Primitives:** `src/components/shell/floating-page-bar.tsx` (`FloatingPageLayout`, `FloatingPageBar`, `FloatingTabsPill`, `FloatingSearchCapsule`, `FloatingBackPill`, `FloatingActionPill`, `FloatingCapsuleCluster`) and `src/components/shell/floating-island.tsx` (`FloatingIsland`, `FloatingIslandCapsule`).

## The rule: strict roles, lenient occupancy

`FloatingPageBar` is a three-slot grid (`1fr / minmax(0,26rem) / 1fr`). Each slot has one fixed role:

| Slot | Role | Contents |
| --- | --- | --- |
| Left | **Context** — "where am I, what can I switch to" | Back button, identity pill, local nav tabs |
| Center | **Content tool** | Search / filter capsule, or nothing |
| Right | **Actions** | Primary action, secondary actions |

Consistency lives at the role level, not the pixel level:

- **Empty slots are fine.** A page without search leaves the center empty. A page without actions leaves the right empty. Do not fill a slot with something from another role just because it is empty.
- **Relocated roles are not fine.** Never put navigation in the center, search on the left, or actions anywhere but the right. Users build spatial memory around what *kind* of thing lives where.

## Left slot: the context cluster

The left slot scales by clustering pills, always in this order:

1. **Back pill** (`FloatingBackPill`, prefer `iconOnly`) — only on detail/leaf pages.
2. **Identity pill** (`FloatingCapsuleCluster` with an `h1`, optionally an avatar) — the entity or page you are inside (deck name, team avatar + name, page title).
3. **Local nav tabs** (`FloatingTabsPill`) — section switching within this area.

If the cluster gets tight, demote the identity (avatar-only, truncated name) — never move search or nav to make room.

## Center slot

Search or filtering for the page's primary collection, via `FloatingSearchCapsule` or a `FloatingIsland` (gallery). Nothing else goes here. If a page has no content tool, leave it empty — it stays reserved so search always appears in the same place when added later.

## Right slot

Page-level actions. Primary action as a filled `FloatingActionPill`; secondary actions as outline/ghost pills. Beyond two or three actions, fold the rest into an overflow menu.

## Titles and descriptions

- Desktop page titles live in the left identity pill, not in an in-content hero. Do not add `PageHero`-style title/description blocks above page content on desktop.
- Descriptive/instructional verbiage ("Shared workspace for…", "Drag cards into lanes…") is dropped, not relocated. If guidance is genuinely needed, put it next to the thing it explains, or in an empty state.
- The pill title should be the `h1` for the desktop layout.

## Mobile

The floating bar is desktop-only (`hidden md:block` inside `FloatingPageLayout`). Mobile keeps its own patterns: in-content headings (`md:hidden` blocks), the `top-bar` shell slot, and `MobileTopBar`. Every page that renders a floating bar must keep an equivalent mobile heading/nav path.

## Page inventory

| Page | Left | Center | Right |
| --- | --- | --- | --- |
| Gallery | — | Search island (`FloatingIsland`) | — |
| Decks list | Tabs (My / Public / Tournament) | Search | New Deck |
| Deck details | Back + deck name pill | — | Set Active, Edit |
| Community | Tabs (Tier Lists / Rankings / Creators) | — | — |
| Tier list detail | Back + title pill + meta cluster | — | Edit / Save / Cancel / Delete |
| Teams landing | — | — | Create Team / Sign in |
| Team hub | Team identity pill + tabs (News … Calendar) | — | Section primary (Create Announcement / Invite member / Create Calendar Item) |
| Teams decks index | Title pill | — | — |
| Settings | Back + title pill | — | — |

## Adding a new page

1. Wrap the page in `FloatingPageLayout` and pass a feature-owned `floating-top-bar.tsx` composing `FloatingPageBar`.
2. Assign content to slots by role using the table above; leave slots empty rather than borrowing roles.
3. Keep a mobile heading path (`md:hidden` block or `top-bar` slot).
4. Put the page/entity title in the left pill as the `h1`; skip the description.
