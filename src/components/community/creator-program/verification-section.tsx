import { CheckCircle2, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CREATOR_BENEFITS, CONTENT_FORMATS, VERIFICATION_STEPS } from "./data";

export function CreatorProgramVerificationSection() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card className="border border-border/60">
        <CardHeader className="space-y-2">
          <CardTitle className="text-lg">Verification Path</CardTitle>
          <CardDescription>Unlock creator tools in four clean steps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {VERIFICATION_STEPS.map((step, index) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {index + 1}. {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}

          <div className="rounded-lg border border-dashed border-border/60 bg-card/40 px-3 py-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
              <Flame className="h-4 w-4 text-secondary" />
              Creator perks
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Early partners get profile modules, subscriber analytics, and spotlight priority.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card className="border border-border/60">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">Creator Benefits</CardTitle>
            <CardDescription>Grow your presence and host community experiences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {CREATOR_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card/60">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border border-secondary/40 bg-background/70">
          <CardHeader className="space-y-2">
            <CardTitle className="text-lg">What You Can Publish</CardTitle>
            <CardDescription>Content formats the community is hungry for.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {CONTENT_FORMATS.map((format) => (
              <Badge key={format} variant="outline" className="text-[10px]">
                {format}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
