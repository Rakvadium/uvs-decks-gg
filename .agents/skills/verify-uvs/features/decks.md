# Decks

Signed-in users create decks, add cards from the gallery to the active deck, review them on the
deck details page, and delete decks. Decks are stored in Convex per user and per game.

## Sub-features

- `decks-list` shows the `/decks` tabs `My Decks`, `Public` and `Tournament`, a `Search decks` field and the `New Deck` button.
- `decks-create` opens the dialog "Create New Deck", where `#create-deck-name` and `Create Deck` take you to `/decks/<id>`.
- `decks-active` makes a new deck the active deck, so gallery cards offer `Add to deck` / `Remove from deck` on hover.
- `decks-details` shows the deck page with `Main Deck N` / `Sideboard N` / `Reference N` sections, `Stacked`/`List` views, a character slot and the `Active`, `Duplicate` and `Edit` actions.
- `decks-tools` covers the right rail's `Gallery`, `Stats`, `Simulator` and `Import/Export` panels. These are not mapped yet.
- `decks-delete` deletes in Edit mode: `Delete deck`, then confirm in the alert dialog. You return to the list.

## How to get to it (user POV)

- Click `Decks` in the left sidebar, or open `/decks`.
- Click `New Deck` in the decks top bar.
- From the gallery, use the hover controls on a card while a deck is active.
- Click a deck tile on `/decks`. Its link is `a[href*="/decks/"]` and its text includes the deck name.

## Driving it with verify-uvs drive.ts

Preconditions: baseline, plus `await signIn(`${hosts.uvs}/decks`)`.

- **Create.** Click `getByRole("button", { name: "New Deck" }).first()`, fill `#create-deck-name`
  with `verify-uvs-<ts>`, and click `Create Deck`. The URL matches `/\/decks\/[a-z0-9]+$/` and the deck name is in the top bar.
- **Add from gallery.** Go to `/gallery`. Hover `main img[alt]` cards in order until
  `getByRole("button", { name: "Add to deck", exact: true })` is enabled, then click it. `Remove from deck` becomes enabled and the count shows 1.
- **Details show it.** Open the deck URL. `getByRole("button", { name: /^Main Deck\s*1$/ })` is
  visible, and the card image (by name) appears under its type group (for example "Attacks 1").
- **Persisted.** Open the deck URL in a second clean context with the same `storageState`. It also shows `Main Deck 1`.
- **Delete.** Click `Edit`, then `Delete deck`, then the delete button in `getByRole("alertdialog")`.
  The URL leaves `/decks/<id>` and the name no longer appears on `/decks`.
- Shipped: `scenarios/deck-lifecycle.ts` covers everything above except `decks-tools`.

## Gotchas

- Characters come first in the gallery's default sort. Their `Add to deck` button is disabled in Standard, so skip ahead to an enabled card.
- `getByRole("button", { name: "Add to deck" })` without `exact: true` matches two buttons. A wrong `.first()` click opens something else and nothing gets added.
- Hover controls render only for the hovered card and take a beat to appear. Wait for them (about 1.5s) before checking whether one is enabled.
- `Active` on the deck page is a state/action button, not a heading. The newest created deck is already active.
- The backend is shared. Delete only `verify-uvs-*` decks. A failed run leaves its deck behind, so delete it afterwards through the UI.
