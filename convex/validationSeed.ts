/**
 * Synthetic fixtures for local validation backends (scripts/validation/seed/build.ts).
 *
 * `seedFixtures` runs once on a fresh backend that already holds the public catalog tables
 * (cards, sets, formats, legality, facets, cardDataVersion). It derives every fixture from a
 * seeded RNG and a fixed epoch, so the same catalog and seed always give the same documents.
 * `buildFixturePlan` is pure (no ctx) so tests can check determinism and that no real-looking
 * identity is produced. Every entry point starts with `assertValidationBackend()`.
 */
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { internalMutation, internalQuery, type MutationCtx } from "./_generated/server";
import { buildAdminSearchText } from "./lib/accountStatus";
import { assertValidationBackend } from "./lib/validationBackend";
import { COMMUNITY_TIER_RANKING, buildCanonicalRankedTiers } from "../shared/app-config";

export const SEED_VERSION = 1;
export const DEFAULT_SEED = "uvs-validation-seed-v1";
/** 2026-10-01T00:00:00Z. Every fixture timestamp is this plus a fixed offset. */
export const SEED_EPOCH = Date.UTC(2026, 9, 1);
export const RESERVED_EMAIL_DOMAIN = "validation.invalid";

const DAY = 24 * 60 * 60 * 1000;
const RECENT_SET_COUNT = 10;
const TIER_LIST_POOL_SIZE = 12;

// ---------------------------------------------------------------------------------------------
// Deterministic helpers

/** FNV-1a, used only to turn the seed string into a 32-bit RNG state. */
function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: small, fast, and identical on every JS runtime. */
export function createRng(seed: string) {
  let state = hashSeed(seed);
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (maxExclusive: number) => Math.floor(next() * maxExclusive);
  const pick = <T>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error("rng.pick: empty list");
    return items[int(items.length)];
  };
  const shuffle = <T>(items: readonly T[]): T[] => {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };
  return { next, int, pick, shuffle };
}

/** Code-unit order, so sorting never depends on the runtime's locale data. */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** JSON with object keys sorted at every level, so equal values always serialize the same way. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(",")}}`;
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

function symbolTokens(symbols: string | undefined): string[] {
  if (!symbols) return [];
  return symbols
    .split(/[,|]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const isAttuned = (token: string) => token.startsWith("attuned:") || token.startsWith("attuned-");

/** The standard identity rule from convex/lib/deckFormatRules.ts (standardMainCardMatchesIdentity). */
function matchesIdentity(card: SeedCard, identity: string, characterTokens: string[]): boolean {
  const tokens = symbolTokens(card.symbols);
  if (tokens.length === 0 || tokens.includes("infinity")) return true;
  const normal = tokens.filter((t) => !isAttuned(t));
  const attunedBases = tokens.filter(isAttuned).map((t) => t.replace(/^attuned[:-]/, ""));
  const attunedOk = attunedBases.length === 0 || attunedBases.some((b) => characterTokens.includes(b));
  return normal.length === 0 ? attunedOk : normal.includes(identity) && attunedOk;
}

/** Identities a character can pick: its plain symbols, minus infinity and "all". */
function identityOptions(character: SeedCard): string[] {
  return symbolTokens(character.symbols).filter((t) => !isAttuned(t) && t !== "infinity" && t !== "all");
}

// ---------------------------------------------------------------------------------------------
// Plan

export type SeedCard = Pick<Doc<"cards">, "_id" | "name" | "type" | "symbols" | "setCode" | "copyLimit" | "oracleId">;
export type SeedSet = Pick<Doc<"sets">, "code" | "name" | "legality" | "setNumber" | "isFuture">;
export type SeedFormat = Pick<Doc<"formats">, "key" | "sideboardRule" | "minDeckSize" | "defaultCopyLimit">;

type UserKey = "alice" | "bruno" | "chen" | "dana" | "eli";
type CardQty = [Id<"cards">, number];
type DeckVisibility = NonNullable<Doc<"decks">["visibility"]>;

export type PlannedUser = { key: UserKey; username: string; email: string };
export type PlannedDeck = {
  key: string;
  owner: UserKey;
  name: string;
  description?: string;
  visibility: DeckVisibility;
  team?: string;
  teamCollaboration: NonNullable<Doc<"decks">["teamCollaboration"]>;
  format: string;
  startingCharacterId: Id<"cards">;
  selectedIdentity: string;
  main: CardQty[];
  side: CardQty[];
};
export type PlannedTierList = {
  key: string;
  owner: UserKey;
  title: string;
  description?: string;
  isPublic: boolean;
  rankingScope: "unranked" | "global";
  selectedSetCodes: string[];
  tiers: Array<{ id: string; label: string; color: string; order: number }>;
  items: Array<{ cardId: Id<"cards">; laneKey: string; order: number }>;
  updatedAt: number;
};
export type FixturePlan = {
  seedVersion: number;
  seed: string;
  epoch: number;
  catalogVersion: number;
  users: PlannedUser[];
  follows: Array<{ follower: UserKey; following: UserKey }>;
  team: {
    key: string;
    name: string;
    slug: string;
    description: string;
    captain: UserKey;
    members: Array<{ user: UserKey; role: Doc<"teamMembers">["role"]; joinedAt: number }>;
    announcements: Array<{ author: UserKey; title: string; body: string; pinned: boolean; createdAt: number }>;
    events: Array<{ title: string; description: string; startsAt: number; endsAt: number; createdBy: UserKey; createdAt: number }>;
    chat: Array<{ author: UserKey; body: string; createdAt: number }>;
  };
  decks: PlannedDeck[];
  deckLikes: Array<{ user: UserKey; deck: string }>;
  tierLists: PlannedTierList[];
  tierListLikes: Array<{ user: UserKey; tierList: string }>;
  tierListComments: Array<{ user: UserKey; tierList: string; content: string; createdAt: number }>;
  cache: {
    liveStatusCheckedAt: number;
    youtube: Array<{
      youtubeVideoId: string;
      label: string;
      accentClass: string;
      sortOrder: number;
      title: string;
      channelTitle: string;
      durationSeconds: number;
      viewCount: number;
      publishedAt: number;
    }>;
  };
};

export type PlanInput = {
  seed: string;
  epoch: number;
  catalogVersion: number;
  sets: SeedSet[];
  formats: SeedFormat[];
  /** Cards from the recent sets only (see `recentSetCodes`). */
  cards: SeedCard[];
  /** `${formatKey}:${cardId}` for every banned card. */
  banned: Set<string>;
};

const USERS: PlannedUser[] = (["alice", "bruno", "chen", "dana", "eli"] as const).map((key) => ({
  key,
  username: `${key}-validation`,
  email: `${key}@${RESERVED_EMAIL_DOMAIN}`,
}));

/** Public YouTube video IDs already curated by default in convex/communityYoutube.ts. */
const YOUTUBE_FIXTURES = [
  { youtubeVideoId: "bcSojOdcJwI", label: "Learn to play", accentClass: "from-primary/20 via-primary/5 to-transparent" },
  { youtubeVideoId: "rJ-ntApwIcs", label: "Basics", accentClass: "from-secondary/20 via-secondary/5 to-transparent" },
  { youtubeVideoId: "LsBRTRaReGM", label: "Event coverage", accentClass: "from-emerald-400/20 via-emerald-400/5 to-transparent" },
];

const ADJECTIVES = ["Relentless", "Blazing", "Silent", "Radiant", "Feral", "Chrome", "Midnight", "Iron"];
const ARCHETYPES = ["Aggro", "Control", "Tempo", "Combo", "Midrange", "Rush"];
const DECK_CARD_TYPES = new Set(["Attack", "Foundation", "Action", "Asset"]);

/** The most recent released sets that are legal in `formatKey`, newest first. */
export function recentSetCodes(sets: SeedSet[], formatKey: string, count = RECENT_SET_COUNT): string[] {
  return sets
    .filter((s) => !s.isFuture && (s.legality ?? "").split("|").includes(formatKey))
    .sort((a, b) => (b.setNumber ?? 0) - (a.setNumber ?? 0) || compareStrings(a.code, b.code))
    .slice(0, count)
    .map((s) => s.code);
}

function sideboardSize(format: SeedFormat): number {
  const m = /^exact:(\d+)$/.exec(format.sideboardRule);
  return m ? Number(m[1]) : 0;
}

function buildDeckCards(
  rng: ReturnType<typeof createRng>,
  candidates: SeedCard[],
  format: SeedFormat,
): { main: CardQty[]; side: CardQty[] } {
  const shuffled = rng.shuffle(candidates);
  const main: CardQty[] = [];
  let total = 0;
  let i = 0;
  for (; i < shuffled.length && total < format.minDeckSize; i++) {
    const limit = Math.max(1, shuffled[i].copyLimit ?? format.defaultCopyLimit);
    const qty = Math.min(limit, 1 + rng.int(4), format.minDeckSize - total);
    main.push([shuffled[i]._id, qty]);
    total += qty;
  }
  if (total < format.minDeckSize) throw new Error(`Not enough cards to build a ${format.minDeckSize}-card deck`);
  const side: CardQty[] = [];
  let sideTotal = 0;
  const sideTarget = sideboardSize(format);
  for (; i < shuffled.length && sideTotal < sideTarget; i++) {
    const qty = Math.min(1 + rng.int(2), sideTarget - sideTotal);
    side.push([shuffled[i]._id, qty]);
    sideTotal += qty;
  }
  return { main, side };
}

export function buildFixturePlan(input: PlanInput): FixturePlan {
  const rng = createRng(input.seed);
  const at = (days: number) => input.epoch + days * DAY;
  const standard = input.formats.find((f) => f.key === "standard") ?? input.formats[0];
  if (!standard) throw new Error("No formats to build decks for");

  const legal = input.cards.filter((c) => !input.banned.has(`${standard.key}:${c._id}`));
  const byName = (a: SeedCard, b: SeedCard) => compareStrings(a.name, b.name) || compareStrings(a._id, b._id);
  const characters = legal
    .filter((c) => c.type === "Character" && identityOptions(c).length > 0)
    .sort(byName);
  // One printing per oracle card, so per-card copy limits hold across reprints.
  const seenOracle = new Set<string>();
  const nonCharacters = legal
    .filter((c) => c.type !== undefined && DECK_CARD_TYPES.has(c.type))
    .sort(byName)
    .filter((c) => {
      const key = c.oracleId ?? c._id;
      if (seenOracle.has(key)) return false;
      seenOracle.add(key);
      return true;
    });
  if (characters.length < 6) throw new Error(`Need at least 6 characters, got ${characters.length}`);

  const usedNames = new Set<string>();
  const deckName = () => {
    for (;;) {
      const name = `${rng.pick(ADJECTIVES)} ${rng.pick(ARCHETYPES)}`;
      if (!usedNames.has(name)) {
        usedNames.add(name);
        return name;
      }
    }
  };

  const deckSpecs: Array<Pick<PlannedDeck, "key" | "owner" | "visibility" | "team" | "teamCollaboration"> & { description?: string }> = [
    { key: "alice-public", owner: "alice", visibility: "public", teamCollaboration: "none", description: "Seeded public deck for validation captures." },
    { key: "alice-private", owner: "alice", visibility: "private", teamCollaboration: "none" },
    { key: "bruno-public", owner: "bruno", visibility: "public", teamCollaboration: "none", description: "Tournament practice list, week 3." },
    { key: "bruno-unlisted", owner: "bruno", visibility: "unlisted", teamCollaboration: "none" },
    { key: "bruno-tournament", owner: "bruno", visibility: "tournament", teamCollaboration: "none", description: "Top 8 list from a synthetic event." },
    { key: "chen-team", owner: "chen", visibility: "team", team: "vanguard", teamCollaboration: "team_editable", description: "Shared team list." },
  ];
  const pickedCharacters = rng.shuffle(characters).slice(0, deckSpecs.length);
  const decks: PlannedDeck[] = deckSpecs.map((spec, index) => {
    const character = pickedCharacters[index];
    const identity = rng.pick(identityOptions(character));
    const characterTokens = symbolTokens(character.symbols);
    const candidates = nonCharacters.filter((c) => matchesIdentity(c, identity, characterTokens));
    const { main, side } = buildDeckCards(rng, candidates, standard);
    return {
      ...spec,
      name: deckName(),
      format: standard.key,
      startingCharacterId: character._id,
      selectedIdentity: identity,
      main,
      side,
    };
  });

  const recent = recentSetCodes(input.sets, standard.key);
  const tierPool = rng.shuffle(characters).slice(0, TIER_LIST_POOL_SIZE);
  const rankedTiers = buildCanonicalRankedTiers();
  const rankedLists: PlannedTierList[] = USERS.map((user, index) => {
    // Each voter shifts every card by up to one lane around a shared base lane, so the community
    // ranking has spread but stays stable.
    const items = tierPool.map((card, order) => {
      const base = Math.floor((order * rankedTiers.length) / tierPool.length);
      const lane = Math.min(rankedTiers.length - 1, Math.max(0, base + rng.int(3) - 1));
      return { cardId: card._id, laneKey: rankedTiers[lane].id, order };
    });
    return {
      key: `${user.key}-ranked`,
      owner: user.key,
      title: `${user.username} character rankings`,
      isPublic: true,
      rankingScope: "global",
      selectedSetCodes: recent,
      tiers: rankedTiers,
      items,
      updatedAt: at(10 + index),
    };
  });
  const customTiers = [
    { id: "tier-top", label: "Top picks", color: "from-primary/25 to-primary/5", order: 0 },
    { id: "tier-solid", label: "Solid", color: "from-secondary/25 to-secondary/5", order: 1 },
    { id: "tier-niche", label: "Niche", color: "from-emerald-400/25 to-emerald-400/5", order: 2 },
  ];
  const customItems = (cards: SeedCard[]) =>
    cards.map((card, order) => ({
      cardId: card._id,
      laneKey: order < 9 ? customTiers[order % customTiers.length].id : "pool",
      order,
    }));
  const tierLists: PlannedTierList[] = [
    ...rankedLists,
    {
      key: "alice-custom",
      owner: "alice",
      title: "Favorite foundations",
      description: "An unranked list with custom lanes.",
      isPublic: true,
      rankingScope: "unranked",
      selectedSetCodes: recent,
      tiers: customTiers,
      items: customItems(rng.shuffle(nonCharacters.filter((c) => c.type === "Foundation")).slice(0, 12)),
      updatedAt: at(16),
    },
    {
      key: "bruno-private",
      owner: "bruno",
      title: "Draft ideas",
      isPublic: false,
      rankingScope: "unranked",
      selectedSetCodes: recent,
      tiers: customTiers,
      items: customItems(rng.shuffle(nonCharacters.filter((c) => c.type === "Attack")).slice(0, 10)),
      updatedAt: at(17),
    },
  ];

  return {
    seedVersion: SEED_VERSION,
    seed: input.seed,
    epoch: input.epoch,
    catalogVersion: input.catalogVersion,
    users: USERS,
    follows: [
      { follower: "bruno", following: "alice" },
      { follower: "chen", following: "alice" },
      { follower: "alice", following: "bruno" },
    ],
    team: {
      key: "vanguard",
      name: "Validation Vanguard",
      slug: "validation-vanguard",
      description: "A synthetic team for validation captures.",
      captain: "alice",
      members: [
        { user: "alice", role: "captain", joinedAt: at(1) },
        { user: "bruno", role: "co_captain", joinedAt: at(2) },
        { user: "chen", role: "pilot", joinedAt: at(3) },
      ],
      announcements: [
        { author: "alice", title: "Welcome", body: "Practice nights are on Thursdays.", pinned: true, createdAt: at(4) },
      ],
      events: [
        { title: "Locals practice", description: "Bring your standard list.", startsAt: at(20), endsAt: at(20) + 3 * 60 * 60 * 1000, createdBy: "alice", createdAt: at(4) },
      ],
      chat: [
        { author: "alice", body: "Deck lists are up in the team tab.", createdAt: at(5) },
        { author: "bruno", body: "Testing the new build tonight.", createdAt: at(5) + 60_000 },
        { author: "chen", body: "Count me in.", createdAt: at(5) + 120_000 },
      ],
    },
    decks,
    deckLikes: [
      { user: "bruno", deck: "alice-public" },
      { user: "chen", deck: "alice-public" },
      { user: "alice", deck: "bruno-public" },
    ],
    tierLists,
    tierListLikes: [
      { user: "bruno", tierList: "alice-ranked" },
      { user: "chen", tierList: "alice-ranked" },
    ],
    tierListComments: [
      { user: "bruno", tierList: "alice-ranked", content: "Agree on the top lane.", createdAt: at(12) },
    ],
    cache: {
      liveStatusCheckedAt: input.epoch,
      youtube: YOUTUBE_FIXTURES.map((video, index) => ({
        ...video,
        sortOrder: index,
        title: `Validation video ${index + 1}`,
        channelTitle: "Validation Channel",
        durationSeconds: 600 + index * 125,
        viewCount: 1000 * (index + 1),
        publishedAt: at(-30 + index),
      })),
    },
  };
}

// ---------------------------------------------------------------------------------------------
// Convex functions

export const seedFixtures = internalMutation({
  args: { seed: v.optional(v.string()), epoch: v.optional(v.number()) },
  returns: v.object({ sha256: v.string(), seedVersion: v.number(), catalogVersion: v.number() }),
  handler: async (ctx, args) => {
    assertValidationBackend();
    if ((await ctx.db.query("users").first()) !== null || (await ctx.db.query("validationSeedMeta").first()) !== null) {
      throw new Error("seedFixtures needs a backend with only the catalog tables imported (users or seed meta already exist)");
    }
    const version = await ctx.db.query("cardDataVersion").first();
    if (!version) throw new Error("seedFixtures: import the catalog tables (cardDataVersion) first");

    const seed = args.seed ?? DEFAULT_SEED;
    const epoch = args.epoch ?? SEED_EPOCH;
    const sets = await ctx.db.query("sets").collect();
    const formats = await ctx.db.query("formats").collect();
    const standardKey = formats.find((f) => f.key === "standard")?.key ?? formats[0]?.key ?? "standard";
    const cards: SeedCard[] = [];
    for (const setCode of recentSetCodes(sets, standardKey)) {
      const rows = await ctx.db
        .query("cards")
        .withIndex("by_setCode_and_collectorNumber", (q) => q.eq("setCode", setCode))
        .collect();
      cards.push(...rows);
    }
    const banned = new Set(
      (await ctx.db.query("cardLegality").collect())
        .filter((row) => row.status === "banned")
        .map((row) => `${row.formatKey}:${row.cardId}`),
    );
    const plan = buildFixturePlan({ seed, epoch, catalogVersion: version.version, sets, formats, cards, banned });
    const sha256 = await sha256Hex(canonicalJson(plan));
    await insertPlan(ctx, plan);
    await ctx.db.insert("validationSeedMeta", {
      seedVersion: plan.seedVersion,
      catalogVersion: plan.catalogVersion,
      sha256,
    });
    return { sha256, seedVersion: plan.seedVersion, catalogVersion: plan.catalogVersion };
  },
});

export const getSeedMeta = internalQuery({
  args: {},
  returns: v.union(v.null(), v.object({ seedVersion: v.number(), catalogVersion: v.number(), sha256: v.string() })),
  handler: async (ctx) => {
    assertValidationBackend();
    const rows = await ctx.db.query("validationSeedMeta").take(2);
    if (rows.length !== 1) return null;
    const { seedVersion, catalogVersion, sha256 } = rows[0];
    return { seedVersion, catalogVersion, sha256 };
  },
});

async function insertPlan(ctx: MutationCtx, plan: FixturePlan): Promise<void> {
  const users = new Map<UserKey, Id<"users">>();
  for (const user of plan.users) {
    const id = await ctx.db.insert("users", {
      username: user.username,
      email: user.email,
      emailVerificationTime: plan.epoch,
      hasVerifiedEmail: true,
      accountStatus: "active",
    });
    await ctx.db.patch(id, { adminSearchText: buildAdminSearchText({ _id: id, ...user }) });
    users.set(user.key, id);
  }
  const user = (key: UserKey) => users.get(key)!;

  for (const follow of plan.follows) {
    await ctx.db.insert("follows", { followerId: user(follow.follower), followingId: user(follow.following) });
  }

  const { team } = plan;
  const teamCreatedAt = team.members[0].joinedAt;
  const teamId = await ctx.db.insert("teams", {
    name: team.name,
    slug: team.slug,
    captainUserId: user(team.captain),
    description: team.description,
    createdAt: teamCreatedAt,
    updatedAt: teamCreatedAt,
  });
  for (const member of team.members) {
    await ctx.db.insert("teamMembers", { teamId, userId: user(member.user), role: member.role, joinedAt: member.joinedAt, status: "active" });
  }
  for (const a of team.announcements) {
    await ctx.db.insert("teamAnnouncements", { teamId, authorUserId: user(a.author), title: a.title, body: a.body, pinned: a.pinned, createdAt: a.createdAt });
  }
  for (const e of team.events) {
    await ctx.db.insert("teamEvents", {
      teamId,
      title: e.title,
      description: e.description,
      startsAt: e.startsAt,
      endsAt: e.endsAt,
      createdByUserId: user(e.createdBy),
      createdAt: e.createdAt,
    });
  }
  for (const m of team.chat) {
    await ctx.db.insert("teamChatMessages", { teamId, authorUserId: user(m.author), body: m.body, createdAt: m.createdAt });
  }

  const decks = new Map<string, Id<"decks">>();
  for (const deck of plan.decks) {
    const quantities = (rows: CardQty[]) => Object.fromEntries(rows.map(([id, qty]) => [id, qty]));
    const id = await ctx.db.insert("decks", {
      userId: user(deck.owner),
      name: deck.name,
      description: deck.description,
      visibility: deck.visibility,
      teamId: deck.team ? teamId : undefined,
      teamCollaboration: deck.teamCollaboration,
      isPublic: deck.visibility === "public" || deck.visibility === "tournament",
      format: deck.format,
      startingCharacterId: deck.startingCharacterId,
      selectedIdentity: deck.selectedIdentity,
      imageCardId: deck.startingCharacterId,
      mainCardIds: deck.main.map(([id]) => id),
      mainQuantities: quantities(deck.main),
      sideCardIds: deck.side.map(([id]) => id),
      sideQuantities: quantities(deck.side),
      referenceCardIds: [],
      referenceQuantities: {},
      revision: 0,
    });
    decks.set(deck.key, id);
  }
  for (const like of plan.deckLikes) {
    await ctx.db.insert("deckLikes", { userId: user(like.user), deckId: decks.get(like.deck)! });
  }

  const tierLists = new Map<string, Id<"tierLists">>();
  for (const list of plan.tierLists) {
    const assigned = list.items.filter((item) => item.laneKey !== "pool");
    const previewCardIds = (assigned.length > 0 ? assigned : list.items).slice(0, 4).map((item) => item.cardId);
    const id = await ctx.db.insert("tierLists", {
      userId: user(list.owner),
      title: list.title,
      ...(list.description ? { description: list.description } : {}),
      isPublic: list.isPublic,
      rankingScope: list.rankingScope,
      rankingScopeKey: list.rankingScope === "global" ? COMMUNITY_TIER_RANKING.globalScopeKey : COMMUNITY_TIER_RANKING.scopes.unranked,
      selectedSetCodes: list.selectedSetCodes,
      previewCardIds,
      tiers: list.tiers,
      itemCount: list.items.length,
      tierCount: list.tiers.length,
      likeCount: plan.tierListLikes.filter((like) => like.tierList === list.key).length,
      commentCount: plan.tierListComments.filter((c) => c.tierList === list.key).length,
      updatedAt: list.updatedAt,
      listModerationStatus: "approved",
      ...(previewCardIds[0] ? { featuredCardId: previewCardIds[0] } : {}),
    });
    for (const item of list.items) {
      await ctx.db.insert("tierListItems", { tierListId: id, cardId: item.cardId, laneKey: item.laneKey, order: item.order });
    }
    tierLists.set(list.key, id);
  }
  for (const like of plan.tierListLikes) {
    await ctx.db.insert("tierListLikes", { userId: user(like.user), tierListId: tierLists.get(like.tierList)! });
  }
  for (const c of plan.tierListComments) {
    await ctx.db.insert("tierListComments", {
      tierListId: tierLists.get(c.tierList)!,
      userId: user(c.user),
      content: c.content,
      status: "approved",
      createdAt: c.createdAt,
      updatedAt: c.createdAt,
    });
  }

  // Community rankings are a cache over the ranked lists; compute them the way saves do, then pin
  // their timestamps to the epoch.
  await ctx.runMutation(internal.communityRankings.recomputeScope, {
    scopeType: "global",
    scopeKey: COMMUNITY_TIER_RANKING.globalScopeKey,
  });
  for (const row of await ctx.db.query("communityCardRankings").collect()) {
    await ctx.db.patch(row._id, { lastComputedAt: plan.epoch });
  }
  for (const row of await ctx.db.query("communityTierSnapshots").collect()) {
    await ctx.db.patch(row._id, { lastComputedAt: plan.epoch });
  }

  // Fixed cache rows, so community pages render without YouTube/Twitch keys.
  await ctx.db.insert("communityLiveStatusCache", { key: "singleton", checkedAt: plan.cache.liveStatusCheckedAt });
  await ctx.db.insert("communityYoutubeCurationInitState", { key: "global" });
  await ctx.db.insert("youtubeFeedRefreshSettings", { key: "global", lastRefreshAttemptAt: plan.epoch });
  for (const video of plan.cache.youtube) {
    await ctx.db.insert("communityYoutubeCurations", {
      youtubeVideoId: video.youtubeVideoId,
      label: video.label,
      accentClass: video.accentClass,
      sortOrder: video.sortOrder,
      source: "manual",
    });
    await ctx.db.insert("youtubeVideoMetadataCache", {
      youtubeVideoId: video.youtubeVideoId,
      title: video.title,
      channelTitle: video.channelTitle,
      durationSeconds: video.durationSeconds,
      viewCount: video.viewCount,
      thumbnailUrl: `https://i.ytimg.com/vi/${video.youtubeVideoId}/hqdefault.jpg`,
      fetchedAt: plan.epoch,
      publishedAt: video.publishedAt,
    });
  }
}
