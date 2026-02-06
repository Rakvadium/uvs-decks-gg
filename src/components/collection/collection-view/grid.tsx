"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useCollectionViewContext } from "./context";

export function CollectionViewGrid() {
  const { collection } = useCollectionViewContext();

  if (!collection || collection.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {collection.map((entry) => (
        <Card key={entry._id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{entry.card?.name}</p>
                <p className="text-sm text-muted-foreground">{entry.card?.setName || entry.card?.setCode}</p>
              </div>
              <div className="text-lg font-semibold">x{entry.quantity}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
