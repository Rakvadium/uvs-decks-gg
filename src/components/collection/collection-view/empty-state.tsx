import { Card, CardContent } from "@/components/ui/card";

export function CollectionViewEmptyState() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Your collection is empty</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Add cards from the gallery to start tracking your collection
        </p>
      </CardContent>
    </Card>
  );
}
