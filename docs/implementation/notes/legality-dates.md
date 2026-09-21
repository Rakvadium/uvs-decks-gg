# Legality timestamps (`effectiveDate` vs `rotatesOutAt`)

Both fields are stored as Unix milliseconds and compared to the current instant when validating decks in Convex (the same wall-clock basis as `Date.now()` in `convex/formats.ts` and `convex/deckValidation.ts`).

## Set rows (`setLegality.rotatesOutAt`)

If `rotatesOutAt` is set and is **less than** the current time, `isSetLegal` treats the set as **not legal** for that format, regardless of `isLegal`. Use this for rotation: the set drops out of the format at that instant.

## Card rows (`cardLegality.effectiveDate`)

If `effectiveDate` is set and is **greater than** the current time, **banned** and **restricted** rules do **not** apply yet; the card behaves as legal until that instant. Omit `effectiveDate` (or use a past time) to apply the status immediately.

## Standard rotation (gallery + deck validation)

Standard exit is computed from set rows, not from a one-off edit:

- `sets.releasedAt` is the release instant. A card is **Future** when that UTC calendar day is after today.
- `sets.printingYear` is the printing year. When it is omitted, the UTC year of `releasedAt` is used.
- `sets.productKind` is `booster` or `other`. Only a booster release starts a rotation year. Deck and other products do not.
- Cards printed in year P leave Standard when the earliest booster whose release day falls in year P + 3 is on or before today.
- The gallery **Rotating** tag shows on Standard during that rotation year, until the first booster of the year releases. The Standard **Next rotation** filter lists printings of (next rotation year − 3) and forces the Rotating tag on those cards.
- `setLegality.rotatesOutAt` still drops a set after that instant. Computed booster rotation applies on top of it for Standard.

## Summary

| Field            | Table        | Meaning |
| ---------------- | ------------ | ------- |
| `rotatesOutAt`   | `setLegality` | Set stops being legal **after** this time. |
| `effectiveDate` | `cardLegality` | Ban/restriction starts **at** this time (future = not active yet). |
