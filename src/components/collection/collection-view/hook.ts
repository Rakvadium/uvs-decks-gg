import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useGameId } from "@/games/game-context";

export function useCollectionViewModel() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");

  const game = useGameId();
  const collection = useQuery(api.collections.listByUser, user ? { game, userId: user._id } : "skip");
  const stats = useQuery(api.collections.getCollectionStats, user ? { game, userId: user._id } : "skip");

  return {
    isAuthenticated,
    authLoading,
    collection,
    stats,
  };
}

export type CollectionViewModel = ReturnType<typeof useCollectionViewModel>;
