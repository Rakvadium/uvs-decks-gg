import { Badge } from "@/components/ui/badge";
import { COMMUNITY_PULSE } from "../../community-content-data";

export function CommunityPulsePosts() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted-foreground">
        <span>Top Posts</span>
        <Badge variant="default" className="text-[9px]">
          Live
        </Badge>
      </div>

      {COMMUNITY_PULSE.map((post) => {
        const Icon = post.icon;

        return (
          <div key={post.title} className="rounded-lg border border-border/60 bg-background/60 px-3 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md border border-border/60 bg-card/60">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{post.title}</p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {post.author} • {post.time}
                  </p>
                </div>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                {post.comments} comments
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
