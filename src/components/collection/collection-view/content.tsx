"use client";

import { CollectionViewAuthRequiredState } from "./auth-required-state";
import { CollectionViewProvider, useCollectionViewContext } from "./context";
import { CollectionViewEmptyState } from "./empty-state";
import { CollectionViewGrid } from "./grid";
import { CollectionViewHero } from "./hero";
import { CollectionViewLoadingState } from "./loading-state";
import { CollectionViewStats } from "./stats";

function CollectionViewContent() {
  const { authLoading, collection, isAuthenticated, stats } = useCollectionViewContext();

  if (authLoading) {
    return <CollectionViewLoadingState />;
  }

  if (!isAuthenticated) {
    return <CollectionViewAuthRequiredState />;
  }

  return (
    <div className="space-y-6">
      <CollectionViewHero />
      {stats && <CollectionViewStats />}
      {!collection || collection.length === 0 ? <CollectionViewEmptyState /> : <CollectionViewGrid />}
    </div>
  );
}

export function CollectionView() {
  return (
    <CollectionViewProvider>
      <CollectionViewContent />
    </CollectionViewProvider>
  );
}
