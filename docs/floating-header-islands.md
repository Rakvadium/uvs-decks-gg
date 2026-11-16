# Floating header islands

Desktop pages use a floating "island" header: islands overlaid on the top of the scroll area instead of a solid chrome bar. This doc defines the slot semantics every page must follow so headers stay predictable as the app grows.

**Primitives:** `src/components/shell/floating-page-bar.tsx` (`FloatingPageLayout`, `FloatingPageBar`, `FloatingTabsPill`, `FloatingSearchCapsule`, `FloatingBackPill`, `FloatingActionPill`, `FloatingCapsuleCluster`) and `src/components/shell/floating-island.tsx` (`FloatingIslandCapsule`, `floatingIslandSurfaceClassName`).

## One island surface

Every header element draws the same island: `rounded-island`, `--control-h-md` (40px) tall, an opaque `--background` fill, and a primary-to-secondary gradient ring in its 1px border. `floatingIslandSurfaceClassName` owns that recipe, and `--chrome-floating-shadow` lifts it. `rounded-island` is a pill in calm, darkmatter and expressive, and the chrome's own `--radius` in bubblegum and holoterminal, so the back pill, capsules, tabs, search and action pills share one shape in each chrome.

Content scrolls under the header, so no header control is transparent. A filled `FloatingActionPill` is the primary action, and `variant="floating"` is the secondary on the island fill. Outline and ghost pills don't compile. Buttons inside an island, such as its tab items or toolbar icons, may be transparent, because the island's fill is what sits over the content.

## The rule: strict roles, lenient occupancy

`FloatingPageBar` is a three-slot grid (`minmax(max-content,1fr) / minmax(0,<center width>) / minmax(max-content,1fr)`). The side slots never shrink below their content, so when a side cluster is wide the center capsule gives up width instead of overlapping it. Each slot has one fixed role:

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

1. **Back pill** (`FloatingBackPill`) — only when this page has a parent to leave for.
   - **Overview drill-back** (Community hub → lists / rankings / creators): `iconOnly`. The hub is the overview; dest tabs live there, not on the drilled page.
   - **Entity back** (an identity pill already names this page): `iconOnly`. The `label` is the destination name for accessibility (`Decks`, `Tier lists`).
   - Never show the word “Back” as visible label text.
2. **Identity pill** (`FloatingCapsuleCluster` with an `h1`, optionally an avatar) — the entity or page you are inside (deck name, team avatar + name, page title).
3. **Local nav tabs** (`FloatingTabsPill`) — section switching within this area.

If the cluster gets tight, demote the identity (avatar-only, truncated name) — never move search or nav to make room.

## Center slot

Search or filtering for the page's primary collection, via `FloatingSearchCapsule`. Trailing controls that belong to the search go in as its children: a scope select, then the result controls (result count, filter panel toggle, view mode), because they act on the search results. Nothing else goes here. If a page has no content tool, leave it empty — it stays reserved so search always appears in the same place when added later.

The center slot has two widths, picked with `FloatingPageBar` `centerWidth`:

| `centerWidth` | Token | Value | When |
| --- | --- | --- | --- |
| `default` | `--floating-center-w` | 26rem | Every page with a plain search, or none |
| `wide` | `--floating-center-w-wide` | 40rem | A search whose result controls live inside its island. The gallery is the one current user |

Both tokens live on `:root` in `src/styles/base.css`. Never use `wide` to fit page actions; those belong in the right slot.

## Right slot

Page-level actions. Primary action as a filled `FloatingActionPill` (opens a flow). Secondary as `FloatingActionPill variant="floating"`. A **context toggle** (Set Active → Active) is not a second primary and is not a dialog opener — off and on must read as different states. Beyond two or three actions, fold the rest into an overflow menu. See [theme-and-chrome.md](./theme-and-chrome.md) control roles.

## Titles and descriptions

- Desktop page titles live in the left identity pill, not in an in-content hero. Do not add `PageHero`-style title/description blocks above page content on desktop.
- Descriptive/instructional verbiage ("Shared workspace for…", "Drag cards into lanes…") is dropped, not relocated. If guidance is genuinely needed, put it next to the thing it explains, or in an empty state.
- The pill title should be the `h1` for the desktop layout.
- Section roots (Home, Decks, Collection, Community, Teams, Settings) show an identity title pill (`FloatingPageTitle`). Gallery is the exception and stays untitled.
- Floating title, back, and tab labels derive family / transform / tracking from chrome via `chrome-heading-case` / `chrome-label-case`. Do not hardcode `uppercase` or `tracking-*` on those controls. Capsule and pill shadows come from `--chrome-floating-shadow`.

## Mobile

The floating bar is desktop-only (`hidden md:block` inside `FloatingPageLayout`). Phone chrome is a different slot system: [mobile-shell.md](./mobile-shell.md). Every desktop floating action still needs an equivalent mobile affordance, placed by that inventory — not by copying left/center/right onto the phone bar.

## Page inventory

| Page | Left | Center | Right |
| --- | --- | --- | --- |
| Home | Title pill | — | — |
| Gallery | — | Wide search island: search, scope select, result count, filter panel toggle, view mode; filter panel anchored below | — |
| Decks list | Tabs (My / Public / Tournament) | Search | New Deck |
| Deck details | Icon-only back + deck name pill | — | Set Active (owner), Duplicate, Edit (owner) |
| Community hub | Dest tabs (Tier Lists / Rankings / Creators) | — | — |
| Creators | Icon-only back to Community | — | — |
| Tier lists browser | Icon-only back + tabs (Rankings / Public / My Lists) | Search (Public / My Lists) | New List |
| Tier list detail | Icon-only back + title pill + meta cluster | — | Edit / Save / Cancel / Delete |
| Teams landing | Title pill | — | Create Team / Sign in |
| Team hub | Team identity pill + tabs (News … Calendar) | — | Section primary (Create Announcement / Invite member / Create Calendar Item) |
| Teams decks index | Title pill | — | — |
| Team invite | Title pill | — | — |
| Settings | Icon-only back + title pill | — | — |
| Collection | Title pill | — | — |

## Adding a new page

1. Wrap the page in `FloatingPageLayout` and pass a feature-owned `floating-top-bar.tsx` composing `FloatingPageBar`. For a page background, pass `pageWash` (`fade`, `radial`, `grid` or `glow`) instead of painting layers in the page.
2. Assign content to slots by role using the table above; leave slots empty rather than borrowing roles.
3. Add the page to [mobile-shell.md](./mobile-shell.md) and place mobile search/actions/back in those slots.
4. Put the page/entity title in the left pill as the `h1`; skip the description.
