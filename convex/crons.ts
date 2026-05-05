import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh community youtube feed cache",
  { hours: 2 },
  internal.communityYoutube.cronRefreshFeed,
  {}
);

crons.interval(
  "prune stale deck presence",
  { minutes: 2 },
  internal.teams.deckCollaboration.pruneStaleDeckPresence,
  {}
);

crons.interval(
  "expire account status windows",
  { minutes: 5 },
  internal.accountStatusExpiry.runExpireStaleStatuses,
  { cursor: null }
);

export default crons;
