import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "refresh community youtube feed cache",
  { hours: 2 },
  internal.communityYoutube.cronRefreshFeed,
  {}
);

export default crons;
