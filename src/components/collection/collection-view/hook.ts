import { useConvexAuth, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";

export function useCollectionViewModel() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.user.currentUser, isAuthenticated ? {} : "skip");

  const collection = useQuery(api.collections.listByUser, user ? { userId: user._id } : "skip");
  const stats = useQuery(api.collections.getCollectionStats, user ? { userId: user._id } : "skip");

  return {
    isAuthenticated,
    authLoading,
    collection,
    stats,
  };
}

export type CollectionViewModel = ReturnType<typeof useCollectionViewModel>;
