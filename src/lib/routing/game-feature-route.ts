import { notFound } from "next/navigation";
import { isGameFeatureEnabled, type GameFeatureKey } from "@shared/games/features";
import { getSharedGameModule } from "@shared/games/registry";
import { isGameId } from "@shared/games/types";

/** True when `game` is a known game that ships `feature` (see `SharedGameModule.features`). */
export function isGameFeatureRouteEnabled(game: string, feature: GameFeatureKey): boolean {
  return isGameId(game) && isGameFeatureEnabled(getSharedGameModule(game).features, feature);
}

/**
 * `[game]` route segment guard: renders the 404 page when the request's game doesn't ship
 * `feature`. Call from a layout/page under `src/app/(app)/[game]/…` with its `params`.
 */
export async function requireGameFeature(
  params: Promise<{ game: string }>,
  feature: GameFeatureKey,
): Promise<void> {
  const { game } = await params;
  if (!isGameFeatureRouteEnabled(game, feature)) notFound();
}
