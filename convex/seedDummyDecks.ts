import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

const DUMMY_PREFIX = "[DUMMY]";

const ADJECTIVES = [
  "Relentless",
  "Blazing",
  "Silent",
  "Grim",
  "Radiant",
  "Feral",
  "Chrome",
  "Midnight",
  "Iron",
  "Vicious",
  "Lucky",
  "Turbo",
  "Rogue",
  "Ancient",
  "Neon",
];

const ARCHETYPES = [
  "Aggro",
  "Control",
  "Tempo",
  "Combo",
  "Midrange",
  "Stall",
  "Rush",
  "Burn",
  "Toolbox",
  "Ramp",
];

const DESCRIPTIONS = [
  "Seeded deck for layout testing.",
  "A pile of cards pretending to be a strategy.",
  "Work in progress, do not judge.",
  "Tournament practice list, week 3.",
  "Budget build with surprising reach.",
  undefined,
];

export const seed = internalMutation({
  args: { count: v.optional(v.number()) },
  returns: v.number(),
  handler: async (ctx, args) => {
    const count = Math.min(Math.max(args.count ?? 30, 1), 100);

    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("No users found to own dummy decks");

    const sampled = await ctx.db.query("cards").take(400);
    const usable = sampled.filter((card) => card.imageUrl);
    if (usable.length < 10) throw new Error("Not enough cards with images to seed decks");

    const characters = usable.filter((card) =>
      card.type?.toLowerCase().includes("character")
    );

    for (let i = 0; i < count; i++) {
      const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
      const archetype = ARCHETYPES[Math.floor(Math.random() * ARCHETYPES.length)];
      const description = DESCRIPTIONS[Math.floor(Math.random() * DESCRIPTIONS.length)];
      const isTournament = i % 5 === 4;

      const deckSize = 8 + Math.floor(Math.random() * 20);
      const mainCardIds: typeof usable[number]["_id"][] = [];
      const mainQuantities: Record<string, number> = {};
      const pool = [...usable];
      for (let j = 0; j < deckSize && pool.length > 0; j++) {
        const pick = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
        mainCardIds.push(pick._id);
        mainQuantities[pick._id] = 1 + Math.floor(Math.random() * 4);
      }

      const imagePool = characters.length > 0 ? characters : usable;
      const imageCard = imagePool[Math.floor(Math.random() * imagePool.length)];

      await ctx.db.insert("decks", {
        userId: user._id,
        name: `${DUMMY_PREFIX} ${adjective} ${archetype} ${i + 1}`,
        description,
        visibility: isTournament ? "tournament" : "public",
        teamCollaboration: "none",
        isPublic: true,
        imageCardId: imageCard._id,
        mainCardIds,
        mainQuantities,
        sideCardIds: [],
        sideQuantities: {},
        referenceCardIds: [],
        referenceQuantities: {},
        revision: 0,
      });
    }

    return count;
  },
});

export const clear = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const decks = await ctx.db.query("decks").collect();
    const dummies = decks.filter((deck) => deck.name.startsWith(DUMMY_PREFIX));
    for (const deck of dummies) {
      await ctx.db.delete(deck._id);
    }
    return dummies.length;
  },
});
