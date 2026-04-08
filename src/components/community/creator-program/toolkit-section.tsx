import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CREATOR_TOOLKIT } from "./data";
import { CommunitySectionHeader } from "../shared/section-header";

export function CreatorProgramToolkitSection() {
  return (
    <section id="creator-toolkit" className="space-y-4">
      <CommunitySectionHeader
        title="Creator Toolkit"
        description="Everything you need to publish, engage, and grow your community presence."
        action={
          <Button variant="outline" size="sm">
            See All Tools
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2">
        {CREATOR_TOOLKIT.map((tool) => {
          const Icon = tool.icon;

          return (
            <div
              key={tool.title}
              className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-4"
            >
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", tool.accent)} />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    {tool.kicker}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-background/70">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold">{tool.title}</h3>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
