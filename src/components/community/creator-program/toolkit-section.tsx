import { cn } from "@/lib/utils";
import { Panel } from "@/components/ui/panel";
import { CREATOR_TOOLKIT } from "./data";
import { CommunitySectionHeader } from "../shared/section-header";
import { SectionHeading } from "@/components/ui/typography-headings";

export function CreatorProgramToolkitSection() {
  return (
    <section id="creator-toolkit" className="space-y-4">
      <CommunitySectionHeader
        title="Creator Toolkit"
        description="Everything you need to publish, engage, and grow your community presence."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {CREATOR_TOOLKIT.map((tool) => {
          const Icon = tool.icon;

          return (
            <Panel key={tool.title} className="relative overflow-hidden p-4">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-40", tool.accent)} />
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span className="chrome-label-case text-[10px] text-muted-foreground">
                    {tool.kicker}
                  </span>
                  <div className="flex size-8 items-center justify-center rounded-control border border-surface bg-background-elevated">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <SectionHeading size="xs">{tool.title}</SectionHeading>
                <p className="text-xs text-muted-foreground">{tool.description}</p>
              </div>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
