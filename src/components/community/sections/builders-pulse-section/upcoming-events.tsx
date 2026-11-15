import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { COMMUNITY_EVENTS } from "../../community-content-data";

export function CommunityUpcomingEvents() {
  return (
    <div id="community-events" className="space-y-3">
      <div className="chrome-label-case flex items-center justify-between text-xs text-muted-foreground">
        <span>Upcoming</span>
        <Badge size="sm" variant="outline">
          Events
        </Badge>
      </div>

      {COMMUNITY_EVENTS.map((event) => {
        const Icon = event.icon;

        return (
          <Panel key={event.label} className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-control border border-surface bg-background-elevated">
                <Icon className="h-3.5 w-3.5 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-semibold">{event.label}</p>
                <p className="chrome-label-case text-[10px] text-muted-foreground">{event.time}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              Remind
            </Button>
          </Panel>
        );
      })}
    </div>
  );
}
