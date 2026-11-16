# Community

The community hub (`/community` on a game host) shows curated YouTube videos and links to tier
lists, rankings and creators. Public tier lists can be opened from the hub.

## Sub-features

- `community-videos` shows video tiles with a duration and title, and an `Open on YouTube` link.
- `community-tabs` provides the `Tier Lists`, `Rankings` and `Creators` navigation.
- `community-tier-list` opens a public tier list at `/community/tier-lists/<id>`.
- `community-rankings` shows rankings at `/community/tier-lists?tab=rankings` (`View Community Rankings`).
- `community-creators` shows the creator program at `/community/creators`.

## How to get to it (user POV)

- Click `Community` in the left sidebar, or open `/community`.
- Use the `Tier Lists`, `Rankings` and `Creators` buttons at the top of the hub.
- Click a tier list tile, or `View Community Rankings`.

## Driving it with verify-uvs drive.ts

Preconditions: baseline. Signed out works for browsing. Sign in to create tier lists.

- **Hub.** `page.goto(`${hosts.uvs}/community`)`. The buttons `Tier Lists`, `Rankings` and
  `Creators` appear, along with video tiles whose text is `<duration>\n\n<title>`.
- **Open a tier list.** Click `page.locator('main a[href^="/community/tier-lists/"]').first()`.
  The URL matches `/community/tier-lists/<id>`. What the page renders hasn't been mapped yet, so add it here when you drive it.
- **Rankings.** Click the `View Community Rankings` link. The URL contains `tab=rankings`.
- **Creators.** Click the `Creator program` link. The URL is `/community/creators`.
- No shipped scenario yet. Start from `scenarios/smoke.ts`.

## Gotchas

- `Tier Lists`, `Rankings` and `Creators` each render twice inside `main`, so use `.first()`.
- Video thumbnails load from `i.ytimg.com` and need network access.
- Anything that writes (tier list create or edit) goes to the shared backend. Name it `verify-uvs-<ts>` and delete it afterwards.
