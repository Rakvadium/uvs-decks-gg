import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SectionHeading } from "@/components/ui/typography-headings";

export function DecksTournamentState() {
  return (
    <Card className="border-2 border-dashed border-secondary/20">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-lg border border-secondary/30" style={{ boxShadow: "var(--chrome-deck-state-icon-shadow)" }}>
          <Trophy className="h-8 w-8 text-secondary/50" />
        </div>
        <SectionHeading className="mb-2 text-lg font-display font-bold uppercase tracking-wider">Coming Soon</SectionHeading>
        <p className="max-w-md text-center text-sm font-mono uppercase tracking-wider text-muted-foreground">
          Tournament decks from competitive events will be available here
        </p>
      </CardContent>
    </Card>
  );
}
