# User account status (admin and enforcement)

## Schema

User documents may include `accountStatus` (`active`, `suspended`, `banned`, `write_restricted`), optional `statusReason` (internal staff), `statusSetAt`, `statusSetBy`, optional `statusExpiresAt`, and optional `userFacingMessage` (shown in-app on restricted surfaces). See [CHANGELOG.md](./CHANGELOG.md) under USR-3, USR-14.

`write_restricted` is the write-only restriction mode: the account can still adjust profile and preferences that use `requireUserCanUpdateProfile`, but cannot use flows guarded by `requireUserCanPostContent` (decks, tier lists, comments, team chat, collection edits, social likes/follows, deck shares, etc.).

## Enforcement (USR-4)

- `requireUserCanPostContent` — blocks non-active accounts from creating or editing UGC.
- `requireUserCanUpdateProfile` — allows `active` and `write_restricted`; blocks `banned` and `suspended` for profile and profanity settings.
- `requireAdmin` — requires the Admin role and a doc status that is not `banned`, `suspended`, or `write_restricted` (query path uses stored fields; expiry is also applied on mutations and by a scheduled job).
- Read-only: banned/suspended users can still load public data (e.g. public decks, community pages) and adjust session-style preferences that are not profile mutations, subject to product decisions.

Bans and suspensions take effect on the next Convex function that enforces these helpers (or the next read path that uses stored status, e.g. admin queries). **Session / JWT:** the client may keep a valid Clerk-issued session until the token expires; this stack does not revoke the identity provider session from Convex. Users stay signed in until the client session ends or they sign out; content writes fail once the backend rejects them.

## User-facing vs internal copy (USR-14)

- `statusReason` — staff-only; shown in the admin user detail, not in the public profile or the account banner.
- `userFacingMessage` — used for the in-app `AccountStatusBanner` and is safe to show to the account holder. If empty, the UI falls back to generic copy by status.

## User administration (UI)

- Directory: [src/app/(app)/admin/users](../src/app/(app)/admin/users) with search, filters, CSV export of the loaded page, and `runUserDirectoryBackfillBatch` to populate `adminSearchText` and related index fields.
- User detail: `/admin/users/[userId]` with status actions, role changes, append-only `moderationAuditLog` listing, and tier list bulk moderation when lists are in `listModerationStatus: "pending"`.

## Moderation audit log (USR-10)

`moderationAuditLog` is append-only from admin actions (`setAccountStatus`, `setUserRole`, `bulkSetTierListListModeration`). Filter by `targetUserId` in `api.adminUsers.listModerationAudit`.

## Out of scope

- **USR-8 — User impersonation:** not implemented. Use separate tooling or support access outside this app if needed.

## Related

- [agent-onboarding.md](./agent-onboarding.md), [content-moderation-and-language-filter.md](./content-moderation-and-language-filter.md) for publish-time text moderation, which is separate from account status.
