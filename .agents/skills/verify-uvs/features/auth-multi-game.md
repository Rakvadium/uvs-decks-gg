# Auth and multi-game hosts

Users sign in once on the apex host (`tcgdecks.localhost`), return to the game host they came
from, and are signed in on the other game host without a prompt (silent SSO). The apex root is a
game picker.

## Sub-features

- `auth-sign-in` signs in with email and password and returns to the originating game page.
- `auth-sso` signs the user in on the second game host with no prompt.
- `auth-sign-out` signs out. The apex session is deleted, though the other host's access token may live up to an hour.
- `auth-game-picker` shows the apex root links to each game.
- `auth-standalone` signs in locally on plain `localhost` (single-game UVS, no handoff).

## How to get to it (user POV)

- Click `Sign In` at the bottom of the left sidebar on a game host. You land on the apex `/sign-in?next=…`.
- Open `/sign-in` on any host directly.
- On mobile, use the `Sign in` tab in the tab bar or the profile sheet's `Sign In`.
- Open the apex root to see the game picker.

## Driving it with verify-uvs drive.ts

Preconditions: baseline. Signed out (every drive starts in a fresh context).

- **Sign in.** `await signIn(`${hosts.uvs}/gallery`)`. It fills `#sign-in-email` and
  `#sign-in-password` and submits `form button[type="submit"]`. Then `page.waitForURL(`${hosts.uvs}/gallery`)`.
  The left sidebar shows a button named after `LOCAL_TEST_USERNAME`.
- **Silent SSO.** `page.goto(`${hosts.cyberpunk}/gallery`)`, then wait (up to 60s) for the
  button named after the username. The sidebar shows "Cyberpunk TCG" and there is no `Sign In` button.
- **Game picker.** `page.goto(`${hosts.apex}/`)`. The links `Open UVS` → `${hosts.uvs}/gallery`
  and `Open CPK` → `${hosts.cyberpunk}/gallery` appear.
- **Sign out.** Open the username button (the user menu), choose sign out, then reload both game
  hosts. The handles here are not mapped yet. Snapshot the menu with `page.getByRole("menu")`
  first, and add what you find to this file.
- Shipped: `scenarios/smoke.ts` covers `auth-sign-in` and `auth-sso`.

## Gotchas

- The sign-in page has two buttons named "Sign in": the flow tab and the submit button. Target the submit button.
- SSO completes a moment *after* the gallery renders. Asserting that `Sign In` is absent right
  away fails. Wait for the username button instead.
- `agent@localhost.dev` and `*@validation.invalid` are reserved and can't use password sign-in.
- Password reset can't work locally (no email key). Don't try to verify it here.
- `curl` and Bun's `fetch` may not resolve `*.localhost`. Chrome does. `lib.ts` `probe()` sends to 127.0.0.1 with a Host header.
