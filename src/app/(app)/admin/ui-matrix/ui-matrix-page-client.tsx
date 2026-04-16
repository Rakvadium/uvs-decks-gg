"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  Surface,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

const BUTTON_VARIANTS = [
  "default",
  "outline",
  "destructive",
  "ghost",
  "link",
  "neon",
  "cyber",
] as const;

const BADGE_TONES = [
  "default",
  "entity",
  "signal",
  "muted",
  "outline",
] as const;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold tracking-wide uppercase text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function UiMatrixPageClient() {
  return (
    <div className="space-y-12 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">UI Matrix</h1>
        <p className="text-muted-foreground">
          Component variant reference for the design system
        </p>
      </div>

      <Section title="Button Variants">
        <div className="flex flex-wrap gap-3 items-center">
          {BUTTON_VARIANTS.map((v) => (
            <Button key={v} variant={v}>
              {v}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {BUTTON_VARIANTS.map((v) => (
            <Button key={v} variant={v} size="sm">
              {v} sm
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {BUTTON_VARIANTS.map((v) => (
            <Button key={v} variant={v} disabled>
              {v}
            </Button>
          ))}
        </div>
      </Section>

      <Section title="Badge Tones">
        <div className="flex flex-wrap gap-3 items-center">
          {BADGE_TONES.map((t) => (
            <Badge key={t} tone={t}>
              {t}
            </Badge>
          ))}
        </div>
      </Section>

      <Section title="Card — fx (default)">
        <Card>
          <CardHeader>
            <CardTitle>FX Card Title</CardTitle>
            <CardDescription>
              This is the default &ldquo;fx&rdquo; variant with glow shadow and
              gradient hover overlay.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sample body content inside a Card with variant=&quot;fx&quot;.
            </p>
          </CardContent>
        </Card>
      </Section>

      <Section title="Card — quiet (Surface)">
        <Surface>
          <CardHeader>
            <CardTitle>Surface Title</CardTitle>
            <CardDescription>
              The &ldquo;quiet&rdquo; variant renders a subdued elevation
              without the glow effects.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Sample body content inside a Surface (quiet Card).
            </p>
          </CardContent>
        </Surface>
      </Section>
    </div>
  );
}
