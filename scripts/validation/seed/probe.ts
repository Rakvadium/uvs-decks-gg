/**
 * Runs a fixed set of public, unauthenticated queries (what the main pages load) against a local
 * validation backend and prints a sha256 per query plus one over all of them:
 *
 *   bun scripts/validation/seed/probe.ts --app-port P
 *
 * Two backends reset to the same golden seed must print identical output. Only loopback URLs are
 * ever queried.
 */
import { isLoopbackUrl } from "../../../convex/lib/validationBackend";
import { canonicalJson } from "../../../convex/validationSeed";
import { REPO_ROOT } from "../convex";
import { defaultValidationRoot, loopbackUrl, portsFor, resolveAppPort } from "../ports";
import { sha256 } from "./manifest";
import { publicQuery } from "./public-data";

type Call = [path: string, args?: Record<string, unknown>];

export async function probe(appPort: number): Promise<{ results: Record<string, string>; sha256: string }> {
  const url = loopbackUrl(portsFor(appPort).cloud);
  if (!isLoopbackUrl(url)) throw new Error(`probe only queries loopback backends, not ${url}`);
  const q = <T>(path: string, args: Record<string, unknown> = {}) => publicQuery<T>(url, path, args);

  const publicDecks = await q<{ _id: string }[]>("decks:listPublic");
  const feed = await q<{ tierList: { _id: string } }[]>("tierLists:listPublicFeed", {});
  const calls: Call[] = [
    ["cards:getCardDataVersion"],
    ["cards:getRarities"],
    ["cards:getTypes"],
    ["cards:getSets"],
    ["sets:list"],
    ["formats:list"],
    ["formats:getCardLegalityByFormat", { formatKey: "standard" }],
    ["decks:listPublic"],
    ["decks:listTournament"],
    ...publicDecks.map((d): Call => ["decks:getById", { deckId: d._id }]),
    ["tierLists:listPublicFeed", {}],
    ...feed.map((f): Call => ["tierLists:getDetail", { tierListId: f.tierList._id }]),
    ["communityRankings:getScopeLeaderboard", { scopeType: "global", scopeKey: "global" }],
    ["communityRankings:listSetScopes"],
    ["communityYoutube:getFeed"],
    ["communityLive:getLiveStatus"],
  ];
  const results: Record<string, string> = {};
  for (const [path, args] of calls) {
    const key = args && Object.keys(args).length > 0 ? `${path} ${canonicalJson(args)}` : path;
    results[key] = sha256(canonicalJson(await q(path, args ?? {})));
  }
  return { results, sha256: sha256(canonicalJson(results)) };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const i = args.indexOf("--app-port");
  try {
    const appPort = resolveAppPort({ flag: i === -1 ? undefined : args[i + 1], env: process.env, worktree: REPO_ROOT, root: defaultValidationRoot() });
    console.log(JSON.stringify(await probe(appPort), null, 2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
