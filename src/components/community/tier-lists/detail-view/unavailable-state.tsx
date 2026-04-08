import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function CommunityTierListDetailUnavailableState() {
  return (
    <div className="flex h-full flex-col items-center justify-center p-6">
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Tier list unavailable</CardTitle>
          <CardDescription>
            This link is private, missing, or not visible to the current account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/community/tier-lists">Return to tier lists</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
