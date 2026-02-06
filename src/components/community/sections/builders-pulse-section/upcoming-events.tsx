import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMMUNITY_EVENTS } from "../../community-content-data";

export function CommunityUpcomingEvents() {
  return (
    <div id="community-events" className="space-y-3">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span>Upcoming</span>
        <Badge variant="outline" className="text-[9px]">
          Events
        </Badge>
      </div>

      {COMMUNITY_EVENTS.map((event) => {
        const Icon = event.icon;

        return (
          <div
            key={event.label}
            className="flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card/60">
                <Icon className="h-3.5 w-3.5 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold">{event.label}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{event.time}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Remind
            </Button>
          </div>
        );
      })}
    </div>
  );
}
