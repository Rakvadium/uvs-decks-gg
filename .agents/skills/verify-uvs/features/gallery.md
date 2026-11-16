# Card gallery

The gallery (`/gallery` on each game host) lists every card in the game's static catalog. Users
search across card text, narrow the list with facet filters, and see the result count change.
The query is mirrored in the URL.

## Sub-features

- `gallery-browse` shows card images, each with `alt` set to the card name.
- `gallery-search` filters by free text and writes `?q=<text>` to the URL.
- `gallery-filters` provides facet chips: UVS has Format, Sets, Type, Symbols, Keywords, Stats and Rarity. Cyberpunk has Format, Sets, Type, Colors, Tags, Stats and Rarity.
- `gallery-count` shows a `<shown>/<total>` counter in the top bar (for example `2,622/2,622`).
- `gallery-deck-controls` shows +/count/− on the hovered card when a deck is active (see [decks](./decks.md)).
- `gallery-view-mode` switches views with `Change view mode` and toggles the panel with `Toggle filter panel`.

## How to get to it (user POV)

- Click `Card Gallery` in the left sidebar, or open `/gallery`.
- Open `?q=` links (shared searches).
- On mobile, use the gallery tab and the filter sheet (`Open filters`).

## Driving it with verify-uvs drive.ts

Preconditions: baseline. Signed out is fine.

- **Browse.** `page.goto(`${hosts.uvs}/gallery`)`, then `page.locator("main img[alt]").first().waitFor()`.
  About 36 images render in the first viewport. UVS starts with "Cana Alberona, Cardslinger".
- **Search.** `page.getByLabel("Search cards").first().fill("Natsu")`, then `page.waitForURL(/[?&]q=Natsu/)`.
  The only result is `getByRole("img", { name: "Natsu Dragneel, Fire Dragon Slayer" })`.
- **Facet filter.** `page.getByRole("button", { name: "Edit Type filter", exact: true }).click()`.
  A panel titled "Filters" lists Action, Arena, Asset, Attack, Backup, Character, Foundation and
  Token, with a count line and a `Show N card(s)` button. Choose an option, then `Show …`. The
  counter and the grid both change.
- **Cyberpunk.** The same recipe on `${hosts.cyberpunk}/gallery`. The total is 152 and the first card is "Lucyna Kushinada: Fresh Beginnings".
- **Count proof.** Read the counter with `page.locator("main").innerText()` or screenshot the top bar. `/` is the search shortcut hint, not the counter.
- Shipped: `scenarios/smoke.ts` covers `gallery-browse` and `gallery-search`.

## Gotchas

- The grid is virtualized. Only on-screen cards exist in the DOM, so don't count images to prove totals. Use the counter.
- `events.jsonl` fills with `Image … is using quality "80" which is not configured` warnings. They are pre-existing noise, not a regression signal.
- A 404 on `/catalog-proxy/…` means the local snapshot points at a catalog R2 has deleted. The gallery falls back to a slower Convex sync. Refresh the snapshot (`docs/local-convex.md`).
- Every drive context starts with an empty browser profile, so the first gallery load always downloads the full catalog.
