# UniVersus ability text

Stored `cards.text` is pipe-delimited rules abilities (`" | "`). The details readout splits on `|` and treats each segment as one ability.

This is **data law** for OCR, admin import, and display. Do not restate keyword reminder boxes as abilities, and do not invent a second colon in a normal ability.

Canonical implementation: [`convex/lib/normalizeAbilityText.ts`](../../convex/lib/normalizeAbilityText.ts). Tests: [`tests/normalize-ability-text.test.ts`](../../tests/normalize-ability-text.test.ts).

## Printed anatomy

Each ability is:

`{Timing} {optional cost} {optional [restriction]}: {effect}`

| Side of `:` | What it is |
| --- | --- |
| Left (header) | When it can be played (Enhance, Response, Blitz, Form, Static, First Enhance, First Form) plus any cost or restriction |
| Right (effect) | What happens |

Examples:

- `Enhance: This attack gets +1 damage.`
- `Enhance Mill 1: Your rival mills 1.`
- `Enhance {commit}: This attack gets +2 damage.`
- `Response [Once per turn]: After you mill 1 or more Psycho cards, add 1 of them to your hand.`

Keywords with ratings (`Powerful 2`, `EX 2`, `Stun 2`) belong in `keywords`, not as extra `text` abilities. The details panel already shows those keywords with hover reminder copy from [`src/config/universus.ts`](../../src/config/universus.ts).

## Reminder text is not an ability

Printed reminder boxes are usually parenthetical, often after Mill, Drive, or a keyword:

- `(Mill 1—Add the top card of your deck to your discard pile.)`
- `(Drive 1—Commit 1 foundation or spend 1 momentum.)`
- `(POWERFUL: 2): Spend 1 or more momentum. This attack gets +2 damage…`

OCR often promotes those boxes into a fake Enhance/Response/Blitz line, e.g. `Enhance {Powerful: 2}: Spend 1 or more momentum…`. Drop them. Keep the unique printed ability (Psycho Hammer keeps `Blitz: Mill 1. Look at the top card of your deck. You may mill 1.`).

Also drop segments that only restate a keyword ability (Powerful, EX, Stun, Breaker, Echo, and the other keyword abilities in `UNIVERSUS_KEYWORD_ABILITIES`). Mid-sentence parentheses that are not reminder boxes stay, e.g. `(rounded up)`.

## One colon per ability

A normal ability has **exactly one** unprotected colon (colons inside `{…}` or `[…]` do not count).

OCR often inserts a timing colon **and** keeps the printed cost colon:

- Printed: `ENHANCE Mill 1: Your rival mills 1.`
- Bad stored: `Enhance: Mill 1: Your rival mills 1.`
- Correct: `Enhance Mill 1: Your rival mills 1.`

Same pattern for `Drive`, `Flip`, `Sacrifice`, and `Enhance: [Once per turn]: …` → `Enhance [Once per turn]: …`.

**Exception:** a bulleted choice list may have more than one colon. Keep `Enhance: Choose one:` (or Choose 1 / two / 2) and keep colons on `•` options. If the preamble is a real cost plus a list, still collapse the extra **timing** colon: `Enhance: Mill 1: Use 1 effect below— • 6 or greater: …` → `Enhance Mill 1: Use 1 effect below— • 6 or greater: …`.

## Where it is enforced

| Path | Role |
| --- | --- |
| `convex/cardOcr.ts` GPT prompt | Instructs Vision Autofill not to transcribe reminder boxes or double-colon timings |
| `normalizeAbilityText` | Strips reminders, collapses extra colons, used on OCR coerce, plain-text parse, import, upsert, and display |
| `convex/lib/cardCreate.ts` / `convex/admin.ts` | Normalizes `text` on import and `/admin/upsert-cards-batch` so search fields match |
| `src/components/universus/card-details/ability-text.tsx` | Display safety net for catalog rows that were stored before the normalizer |

After changing stored `text` in bulk, upsert the cards and publish a catalog release so search and the details JSON match the readout.

## Out of scope here

Resource-symbol matching (circle vs attuned square) is a separate pipeline: [`src/lib/universus/match-resource-symbols.ts`](../../src/lib/universus/match-resource-symbols.ts). Do not send the full card image to GPT for bottom-strip symbols.
