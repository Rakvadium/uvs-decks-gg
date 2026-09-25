import type { MutationCtx } from "../_generated/server";
import { getSharedGameModule } from "../../shared/games/registry";
import type { GameId } from "../../shared/games/types";
import { findFormatByKey, gameTagPatch } from "./gameScope";

/**
 * Creates the game's default formats (`SharedGameModule.defaultFormats`) that don't exist yet and
 * re-syncs the `standard` rules on an existing row. Idempotent. Used by `admin.seedFormats` and
 * `devSeed`.
 */
export async function seedGameFormats(
  ctx: MutationCtx,
  game: GameId,
): Promise<{ created: number; skipped: number }> {
  // Per-game seed list (`shared/games/<game>/formats.ts`); UVS values are unchanged.
  const defaultFormats = getSharedGameModule(game).defaultFormats;

  let created = 0;
  let skipped = 0;

  for (const format of defaultFormats) {
    const existing = await findFormatByKey(ctx, game, format.key);

    if (existing) {
      const tag = gameTagPatch(existing, game);
      if (tag) {
        await ctx.db.patch(existing._id, tag);
      }
      if (format.key === "standard") {
        await ctx.db.patch(existing._id, {
          sideboardRule: format.sideboardRule,
          requiresIdentity: format.requiresIdentity,
          minDeckSize: format.minDeckSize,
          defaultCopyLimit: format.defaultCopyLimit,
          requiresStartingCharacter: format.requiresStartingCharacter,
          // Only games that define a max (Cyberpunk) sync it; UVS rows keep whatever they have.
          ...(format.maxDeckSize !== undefined ? { maxDeckSize: format.maxDeckSize } : {}),
        });
      }
      skipped++;
      continue;
    }

    await ctx.db.insert("formats", { ...format, game });
    created++;
  }

  return { created, skipped };
}
