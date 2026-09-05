# Mobile shell slots

Phone-width chrome is a compact top nav plus a floating bottom stack. This doc defines the slot semantics every mobile page must follow so navigation, page actions, and contextual panels always live in the same places.

Desktop island headers are a different system: [floating-header-islands.md](./floating-header-islands.md). Do not copy desktop left/center/right onto the phone bar.

**Primitives:** `src/components/shell/mobile-nav-bar/` (`MobileNavBar`, `resolveMobileNavPage`), `src/components/shell/mobile-tab-bar/` (`MobileTabBar`, `resolveMobileBottomTools`, `MobileActButton`, `MobileProfileTab`, `MobileSearchField`, `MobileGlassCapsule`, `metrics.ts`), `src/components/shell/mobile-large-title.tsx`, `src/components/shell/mobile-actions-sheet/`, `src/components/shell/mobile-profile-sheet/`, `src/components/shell/mobile-glass.ts`.

Route maps: `mobile-nav-bar/page-config.ts` (top nav) and `mobile-tab-bar/page-tools.ts` (search + act buttons).

## The three verbs

Everything in the bottom stack is one of three kinds of control. Decide which verb a control is before deciding where it goes.

| Verb | Question it answers | Where it lives | Examples |
| --- | --- | --- | --- |
| **Peek** | *Show me more about what I'm looking at* | Peek circle (top row) → actions sheet panels | Active deck, deck list, deck gallery, stats, hand simulator, import/export, tier-list pool |
| **Go** | *Take me somewhere else* | Go capsule (bottom row, left) | Cards, Decks, Community, Profile |
| **Act** | *Do something to this page's object* | Act capsule (bottom row, right) | Search, Filters, New deck, Edit, New tier list |

Peek never mutates. Act never navigates between sections. Go never changes page state. If a control does two of these, split it.

## The rule: strict roles, lenient occupancy

Each slot has one fixed role. Slots may be empty; roles never move.

- **Empty slots are fine.** A page without search omits the Search button. A page with no `right-sidebar` slots omits the Peek circle. Do not fill a slot with something from another role.
- **Relocated roles are not fine.** Never put search in the top nav, a section destination in the Act capsule, or a page action in the Go capsule. Users build spatial memory around what *kind* of thing lives where.
- **Every signed-in page should register at least one Peek.** The Peek circle is the one control that is always present when it can be, so the bottom stack keeps a consistent silhouette.

## Top nav (`MobileNavBar`)

Three-column grid (`1fr / auto / 1fr`), 44px row (`MOBILE_NAV_ROW_HEIGHT_CLASS`), safe-area padded.

| Slot | Role | Contents |
| --- | --- | --- |
| Leading | **Context** — how I got here | Brand mark, or back to the parent |
| Center | **Identity** — where I am | Compact title, or `sr-only` on brand roots |
| Trailing | **Persistent chrome** | Media dock toggle on brand/section roots. Tier lists keeps its New list action here for now. |

The top nav holds no Profile control, no search, no filters, and no deck primaries. Those moved to the bottom stack. `DeckDetailsSetActiveNavButton` is kept exported but unused until Set Active gets a slot.

### Leading: context

1. **Brand** (`kind: "brand"`) — gallery. Wordmark + mark.
2. **Back** (`kind: "child"` / deck details / tier-list detail) — `MobileNavBackButton` to the parent. `aria-label` is the destination (`Decks`, `Community`), never the word “Back”.
3. **Mark-only brand** (`kind: "section"`) — section roots that already show a large title in content (Decks, Community, Collection, Teams).

### Center: identity

- **Section roots** use `MobileNavTitle` with `collapsible`. The large in-content title (`MobileLargeTitle`) is the `h1`; the nav title fades in when that large title scrolls away.
- **Child pages** use a persistent compact title.
- **Brand roots** keep the title `sr-only`.

## Bottom stack (`MobileTabBar`)

One row (Go + Act) in the default `"act"` and `"tabs"` placements, or two rows (Peek above Go + Act) in `"row"` placement, `MOBILE_TAB_METRICS.rowGap` apart, safe-area padded. All sizes come from `mobile-tab-bar/metrics.ts`:

| Constant | Default | Meaning |
| --- | --- | --- |
| `rowHeight` | 48 | Height of every capsule/circle body |
| `tabWidth` | 48 | Width of each Go tab (capsule is `4 × tabWidth`) |
| `actSize` | 44 | Diameter of each Act button inside its capsule |
| `iconSize` | 20 | Glyph size everywhere in the stack |
| `rowGap` | 8 | Gap between rows and between capsules |
| `MOBILE_PEEK_PLACEMENT` | `"act"` | `"act"`: Peek is the far-right item of the Act capsule (single row). `"tabs"`: Peek sits inside the Go capsule after Profile. `"row"`: Peek is a detached circle on its own row above. |
| `MOBILE_PEEK_SIDE` | `"start"` | In `"row"` placement, which side the Peek circle sits on |

Change a number there and every capsule follows; do not hardcode sizes in page components. `tabWidth` / `actSize` are tuned per placement (`PLACEMENT_METRICS`) so the widest page (gallery: 4 tabs + Search · Filters · Peek) still fits a 360px screen.

### Peek

Present only when the page has `right-sidebar` slots. In `"act"` placement it is the last item of the Act capsule, behind a hairline when page actions precede it; the Act capsule then exists whenever the page has search, actions, or panels. In `"tabs"` placement it is the last item of the Go capsule. In `"row"` placement it is a detached circle on its own row aligned to `MOBILE_PEEK_SIDE`.

- Icon is **always the default (first-registered) slot**, not the last-viewed panel. The circle is a stable landmark for “this page's panels”, not a status indicator.
- `iconFit: "media"` (active deck art) fills the detached circle or the Act button, or renders as a `size-7` avatar-style disc inside a Go tab; glyph icons stay at `iconSize`.
- `aria-label` is the slot label. Tapping opens the actions sheet on the default panel.
- Hidden while search is expanded; the whole stack slides away while the sheet is open.

### Go capsule (left)

Fixed width (`4 × tabWidth`), always the same four tabs in the same order: **Cards, Decks, Community, Profile** (plus Peek after a hairline only in `"tabs"` placement). Icon-only, `aria-label` names them. The capsule never stretches to fill the row; the Act capsule sits to its right and is simply omitted when empty.

- Cards / Decks / Community are hard routes with `aria-current="page"`.
- Profile (`MobileProfileTab`) shows the avatar when signed in and opens the profile sheet; signed out it is a generic glyph that opens the auth dialog.

### Act capsule (right)

Optional capsule of `MobileActButton`s registered in `resolveMobileBottomTools`. Order left → right: **Search**, then page actions, then **Peek** (in `"act"` placement).

- **Search** expands the field over the entire row (tabs + actions). The Act capsule collapses to a single **Close** button; Escape or Close collapses it. A live query leaves the Search button tinted with a dot.
- **Filters** is its own button, not an adornment inside the field. On gallery it opens `GalleryMobileFilterSheet` (mobile-first: chips, symbol toggles, drill-in pickers for sets/keywords, stat steppers, live result count).
- **Primary flow starters** (New deck, Edit) use `tone="primary"`. At most one per page.
- Pages register `Actions` + `useActionsState` alongside `Search` + `useSearchState`; either half may be absent.

## Actions sheet (Peek panels)

`mobile-actions-sheet/` renders `right-sidebar` slots as a draggable bottom sheet.

- Opens on the **default panel** (first registered slot). No back chevron, no panel grid.
- **Header:** grabber, panel title (or the slot's `header`), **Done**.
- **Footer:** when a page has more than one panel, an icon+label switcher (`role="tablist"`) on the left; the active slot's `footer` actions (Open deck details, Redraw, …) on the right. Panel-specific actions never render inside the panel body on mobile.
- Register with `useRegisterSlot("right-sidebar", …)` and supply `label`, `icon`, optional `tabLabel` (short switcher text when `label` is dynamic, e.g. a deck name → “Active Deck”), `iconFit: "media"` only for art that should fill the circle, and `header` / `footer` when the panel has them.
- Priority `0` is the default panel. Deck details defaults to Gallery; gallery and decks default to Active Deck.

## In content

| Kind | Placement |
| --- | --- |
| Section title | `MobileLargeTitle` under the nav (Decks, Community, Collection, …) |
| Scope / destination switch | Segmented control **under** the large title (Mine/Public/Tourny, Community dests, tier-list tabs) |
| Body scroll | Pad with `--mobile-nav-h` and `--mobile-tab-h` |

Do not rebuild a second search bar, a second primary-nav row, or a tool-tile row in the page. Peek handles panels; Act handles actions.

## Sheets

| Sheet | Opens from | Holds |
| --- | --- | --- |
| Actions sheet | Peek circle | `right-sidebar` panels + footer switcher |
| Filter sheet | Act → Filters | Mobile gallery filters (root, Sets, Keywords, Stats pages) |
| Profile sheet | Go → Profile (signed in) | Account, prefs, full navigation, Feedback, sign out |
| Auth dialog | Go → Profile (signed out); Sign In in the profile footer | Sign in |

Nested sheet → dialog needs `suppressSubsequentPointerEvents`.

## Page inventory

| Page | Top L | Top C | Top R | Peek (default first) | Act |
| --- | --- | --- | --- | --- | --- |
| Gallery | Brand | sr-only “Cards” | Media | Active deck (art) · Decks | Search · Filters |
| Decks list | Mark | Collapsible “Decks” | Media | Active deck (signed in) | Search · New deck |
| Deck details | Back → Decks | Deck name | — | Gallery · Stats · Simulator · Import/Export | Edit (owner) |
| Community hub | Mark | Collapsible “Community” | Media | Tier Lists panel | — |
| Tier lists | Back → Community | “Tier Lists” | New list | — | Search (not on Rankings) |
| Tier list detail | `top-bar` slot (full row) | (in slot) | — | — | — |
| Rankings / Creators | Back → Community | Title | — | — | — |
| Collection | Mark | Collapsible “Collection” | Media | — | — |
| Teams landing | Mark | Collapsible “Teams” | Media | — | — |
| Team hub / invite / decks | Back → Teams | Title | — | — | — |
| Settings | Back → Cards | “Settings” | — | — | — |
| Admin | Mark / back | “Admin” | Media on root | Admin nav slot | — |

“—” means leave the slot empty or omit the capsule. Do not borrow another role to fill it.

## Adding a new mobile page

1. Add a `resolveMobileNavPage` entry (brand / section / child, back target, media toggle). Do not add account or search controls there.
2. Decide each control's verb (Peek / Go / Act). Go is fixed; do not touch it.
3. Act: register `Search` + `useSearchState` and/or `Actions` + `useActionsState` in `resolveMobileBottomTools`. Actions are `MobileActButton`s using `MOBILE_TAB_ICON_CLASS`.
4. Peek: `useRegisterSlot("right-sidebar", …)` with `label`, `icon`, and `priority: 0` on the panel that should be the default. Add `footer` for panel actions; they surface in the sheet footer. Signed-in pages should have at least one.
5. Section roots: `MobileLargeTitle` + any scope control under it.
6. Pad scroll with `--mobile-nav-h` / `--mobile-tab-h` (or reuse `FloatingPageLayout`’s mobile padding).
7. Update the inventory table in this file in the same change.

## Anti-patterns

- Persistent full-width search field above the tab bar
- Filter as an adornment inside the search field
- Profile, New deck, Edit, or Set Active in the top nav
- Page actions inside the Go capsule, or destinations inside the Act capsule
- Stretching the Go capsule to fill the row when Act is empty
- Peek icon that changes to the last-viewed panel
- A back chevron or panel grid inside the actions sheet
- Panel footer actions rendered inside the panel body on mobile
- Tool-tile rows or a second bottom toolbar of labeled pills in content
- Desktop floating-bar slots reused as the mobile layout
