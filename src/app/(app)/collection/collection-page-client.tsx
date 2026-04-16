"use client";

import { CollectionView } from "@/components/collection";

export default function CollectionPageClient() {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-6">
      <CollectionView />
    </div>
  );
}
