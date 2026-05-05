# Legality timestamps (`effectiveDate` vs `rotatesOutAt`)

Both fields are stored as Unix milliseconds and compared to the current instant when validating decks in Convex (the same wall-clock basis as `Date.now()` in `convex/formats.ts` and `convex/deckValidation.ts`).

## Set rows (`setLegality.rotatesOutAt`)

If `rotatesOutAt` is set and is **less than** the current time, `isSetLegal` treats the set as **not legal** for that format, regardless of `isLegal`. Use this for rotation: the set drops out of the format at that instant.

## Card rows (`cardLegality.effectiveDate`)

If `effectiveDate` is set and is **greater than** the current time, **banned** and **restricted** rules do **not** apply yet; the card behaves as legal until that instant. Omit `effectiveDate` (or use a past time) to apply the status immediately.

## Summary

| Field            | Table        | Meaning |
| ---------------- | ------------ | ------- |
| `rotatesOutAt`   | `setLegality` | Set stops being legal **after** this time. |
| `effectiveDate` | `cardLegality` | Ban/restriction starts **at** this time (future = not active yet). |
