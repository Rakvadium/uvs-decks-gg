# Team invite emails (stub)

Invite links use this app route:

`https://<your-domain>/teams/invite/<token>`

The raw token is returned once from `api.teams.invites.createInvite` and must be sent to the recipient (for example via Resend) in that URL. Only a **SHA-256 hash** of the token is stored in `teamInvites.tokenHash`.

When outbound email is wired, call `createInvite` server-side or from an authenticated client, send the link, and do not log the token.
