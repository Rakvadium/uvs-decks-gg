# #245 live probe (read-only, local validation backend)

Throwaway scripts, not committed. They run from the worktree root against a local validation backend on app port 8127, loaded with golden seed v1. One synthetic local admin (`admin-validation`) was added with `vconvex import --table users --append`. Moderation was applied as that admin through the real `adminUsers:bulkSetTierListListModeration`: `bruno-ranked` (`qs7b2s…`) was set to `rejected` and `chen-ranked` (`qs70fp…`) to `pending`. Every Convex call goes through `bun run vconvex -- --app-port 8127 run [--identity]`. No cloud deployment was touched.

The `origin/dev` run came before the change. For the branch run, the seed was reset, the admin re-imported (new id) and moderation re-applied, so the new recompute path also ran. The global leaderboard `contributorCount` went 5, then 4 (after the rejection), then 3 (after the pending mark).

## Output: origin/dev functions

```
## anonymous
listPublicFeed rows=6 hiddenShown=[pending(chen):status=pending, rejected(bruno):status=rejected] rowsCarryingStatus=6
getDetail rejected(bruno) -> visible canEdit=false tierList.listModerationStatus=rejected top.listModerationStatus=absent
getDetail pending(chen) -> visible canEdit=false tierList.listModerationStatus=pending top.listModerationStatus=absent

## member(eli)
listPublicFeed rows=6 hiddenShown=[pending(chen):status=pending, rejected(bruno):status=rejected] rowsCarryingStatus=6
getDetail rejected(bruno) -> visible canEdit=false tierList.listModerationStatus=rejected top.listModerationStatus=absent
getDetail pending(chen) -> visible canEdit=false tierList.listModerationStatus=pending top.listModerationStatus=absent
listMine rows=1 statuses=[qs79ss:approved]

## owner(bruno)
listPublicFeed rows=6 hiddenShown=[pending(chen):status=pending, rejected(bruno):status=rejected] rowsCarryingStatus=6
getDetail rejected(bruno) -> visible canEdit=true tierList.listModerationStatus=rejected top.listModerationStatus=absent
getDetail pending(chen) -> visible canEdit=false tierList.listModerationStatus=pending top.listModerationStatus=absent
listMine rows=2 statuses=[qs764k:approved, rejected(bruno):rejected]

## owner(chen)
listPublicFeed rows=6 hiddenShown=[pending(chen):status=pending, rejected(bruno):status=rejected] rowsCarryingStatus=6
getDetail rejected(bruno) -> visible canEdit=false tierList.listModerationStatus=rejected top.listModerationStatus=absent
getDetail pending(chen) -> visible canEdit=true tierList.listModerationStatus=pending top.listModerationStatus=absent
listMine rows=1 statuses=[pending(chen):pending]

## admin
listPublicFeed rows=6 hiddenShown=[pending(chen):status=pending, rejected(bruno):status=rejected] rowsCarryingStatus=6
getDetail rejected(bruno) -> visible canEdit=false tierList.listModerationStatus=rejected top.listModerationStatus=absent
getDetail pending(chen) -> visible canEdit=false tierList.listModerationStatus=pending top.listModerationStatus=absent
listMine rows=0 statuses=[]

communityRankings:getScopeLeaderboard(global) contributorCount=5 rankedCardCount=12
```

## Output: this branch

```
## anonymous
listPublicFeed rows=4 hiddenShown=[] rowsCarryingStatus=0
getDetail rejected(bruno) -> null
getDetail pending(chen) -> null

## member(eli)
listPublicFeed rows=4 hiddenShown=[] rowsCarryingStatus=1      <- eli's own approved list
getDetail rejected(bruno) -> null
getDetail pending(chen) -> null
listMine rows=1 statuses=[qs79ss:approved]

## owner(bruno)
listPublicFeed rows=5 hiddenShown=[rejected(bruno):status=rejected] rowsCarryingStatus=1
getDetail rejected(bruno) -> visible canEdit=true tierList.listModerationStatus=absent top.listModerationStatus=rejected
getDetail pending(chen) -> null
listMine rows=2 statuses=[qs764k:approved, rejected(bruno):rejected]

## owner(chen)
listPublicFeed rows=5 hiddenShown=[pending(chen):status=pending] rowsCarryingStatus=1
getDetail rejected(bruno) -> null
getDetail pending(chen) -> visible canEdit=true tierList.listModerationStatus=absent top.listModerationStatus=pending
listMine rows=1 statuses=[pending(chen):pending]

## admin
listPublicFeed rows=6 hiddenShown=[pending(chen):status=pending, rejected(bruno):status=rejected] rowsCarryingStatus=6
getDetail rejected(bruno) -> visible canEdit=false tierList.listModerationStatus=absent top.listModerationStatus=rejected
getDetail pending(chen) -> visible canEdit=false tierList.listModerationStatus=absent top.listModerationStatus=pending
listMine rows=0 statuses=[]

communityRankings:getScopeLeaderboard(global) contributorCount=3 rankedCardCount=0   <- 3 voters < minimumVotesToRank (5)
```

Also on the branch:
- `tierLists:toggleLike` on the rejected list as member(eli) fails with `Not authorized`.
- `tierLists:addComment` on the pending list as member(eli) fails with `Not authorized`.
- Approving `chen-ranked` brought `contributorCount` back to 4. Marking it pending again dropped it to 3.

## probe.ts (bun)

```ts
import { spawnSync } from "node:child_process";

const PORT = "8127";
const REJECTED = "qs7b2s2cvb4vqkczfgwnq6z2tp0zj4tr"; // bruno-ranked
const PENDING = "qs70fppx3m5pjynp16tv32asewf9w3sh"; // chen-ranked
const HIDDEN = new Map([[REJECTED, "rejected(bruno)"], [PENDING, "pending(chen)"]]);
const VIEWERS: Array<[string, string | null]> = [
  ["anonymous", null],
  ["member(eli)", "r17d190c3xm1vgvw3cce4xxecj9j5h79"],
  ["owner(bruno)", "r17a8pbz6fk5jetx6b1dv8y47m84gra6"],
  ["owner(chen)", "r171kckp68406hb7sp0ajzqfwgrrrf16"],
  ["admin", "<local admin-validation id>"],
];

function run(fn: string, args: object, userId: string | null) {
  const identity = userId
    ? ["--identity", JSON.stringify({ subject: `${userId}|probe`, issuer: "https://probe.invalid", tokenIdentifier: `probe|${userId}` })]
    : [];
  const r = spawnSync("bun", ["run", "vconvex", "--", "--app-port", PORT, "run", ...identity, fn, JSON.stringify(args)], { encoding: "utf8", shell: false });
  if (r.status !== 0) return { ok: false, error: (r.stderr + r.stdout).match(/Uncaught Error: ([^\n]+)/)?.[1] ?? `exit ${r.status}` };
  const out = r.stdout.trim();
  const start = out.search(/^(\{|\[|null|true|false|\d)/m);
  return { ok: true, value: start < 0 ? null : JSON.parse(out.slice(start)) }; // `convex run` prints nothing for null
}
// For each viewer: listPublicFeed({limit:24}), getDetail(REJECTED), getDetail(PENDING), listMine({limit:30});
// then communityRankings:getScopeLeaderboard(global) signed out. Prints ids, field presence and counts only.
```

## owner-capture.mjs (node + playwright)

The browser is signed out. The proxy drops every `Mutation`/`Action` frame. It swaps the browser-side results of `user:currentUser`, `tierLists:getDetail(qs7b2s…)` and `tierLists:listPublicFeed` for what the server returns to the owner (bruno). Those results are fetched at capture time with `vconvex run --identity`, so the before and after shots show what each code version returns to the owner. Both runs blocked only `Action:communityLive:refreshLiveStatus ×8`. Results replaced: `getDetail ×2`, `currentUser ×4`, `listPublicFeed ×2`.

```js
function replacementFor(sub) {
  if (sub.udfPath === "user:currentUser") return ownerUser;          // vconvex run --identity bruno user:currentUser
  if (sub.udfPath === "tierLists:getDetail" && sub.args?.tierListId === REJECTED) return ownerDetail;
  if (sub.udfPath === "tierLists:listPublicFeed") return feedFor(sub.args?.limit ?? 12);
}
await context.routeWebSocket(/\/api\/[^/]+\/sync$/, (ws) => {
  const server = ws.connectToServer();
  const subs = new Map();
  ws.onMessage((message) => {
    const frame = JSON.parse(message);
    if (frame?.type === "Mutation" || frame?.type === "Action") { log.blocked.push(`${frame.type}:${frame.udfPath}`); return; }
    if (frame?.type === "ModifyQuerySet") for (const m of frame.modifications ?? []) {
      if (m.type === "Add") subs.set(m.queryId, { udfPath: m.udfPath.replace(".js:", ":"), args: m.args?.[0] });
      if (m.type === "Remove") subs.delete(m.queryId);
    }
    server.send(message);
  });
  server.onMessage((message) => {
    const frame = JSON.parse(message);
    if (frame?.type === "Transition") {
      let touched = false;
      for (const m of frame.modifications) {
        const sub = subs.get(m.queryId);
        const value = m.type === "QueryUpdated" && sub ? replacementFor(sub) : undefined;
        if (value !== undefined) { m.value = value; touched = true; }
      }
      if (touched) return ws.send(JSON.stringify(frame));
    }
    ws.send(message);
  });
});
// Shots: /community/tier-lists/qs7b2s… and /community/tier-lists, desktop 1280x800@1x and mobile 390x844@2x, dark.
```
