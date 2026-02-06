import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CommunityPulsePosts } from "./pulse-posts";
import { CommunityUpcomingEvents } from "./upcoming-events";

export function CommunityPulseCard() {
  return (
    <Card className="h-full border border-border/60">
      <CardHeader className="space-y-2">
        <CardTitle className="text-lg">Community Pulse</CardTitle>
        <CardDescription>Live snapshots from across the community.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <CommunityPulsePosts />
        <CommunityUpcomingEvents />
      </CardContent>
    </Card>
  );
}
