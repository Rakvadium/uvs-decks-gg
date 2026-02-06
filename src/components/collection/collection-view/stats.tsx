"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollectionViewContext } from "./context";

function CollectionStatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function CollectionViewStats() {
  const { stats } = useCollectionViewContext();

  if (!stats) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <CollectionStatCard label="Total Cards" value={stats.totalCards} />
      <CollectionStatCard label="Unique Cards" value={stats.uniqueCards} />
      <CollectionStatCard label="Sets" value={Object.keys(stats.bySet).length} />
    </div>
  );
}
