import { Badge } from "@/components/ui/badge";
import { Panel } from "@/components/ui/panel";
import { COMMUNITY_PULSE } from "../../community-content-data";

export function CommunityPulsePosts() {
  return (
    <div className="space-y-3">
      <div className="chrome-label-case flex items-center justify-between text-xs text-muted-foreground">
        <span>Top Posts</span>
        <Badge size="sm" variant="default">
          Live
        </Badge>
      </div>

      {COMMUNITY_PULSE.map((post) => {
        const Icon = post.icon;

        return (
          <Panel key={post.title} className="px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <div className="flex size-7 items-center justify-center rounded-control border border-surface bg-background-elevated">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{post.title}</p>
                  <p className="chrome-label-case text-[10px] text-muted-foreground">
                    {post.author} • {post.time}
                  </p>
                </div>
              </div>
              <span className="chrome-label-case text-[10px] text-muted-foreground">
                {post.comments} comments
              </span>
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
