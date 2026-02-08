import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatBlockProps {
  icon: LucideIcon;
  label: string;
  value: string | number | undefined;
  color?: "primary" | "secondary" | "accent" | "destructive" | "orange";
}

const COLOR_CLASSES = {
  primary: "text-primary border-primary/30 bg-primary/10",
  secondary: "text-secondary border-secondary/30 bg-secondary/10",
  accent: "text-accent border-accent/30 bg-accent/10",
  destructive: "text-destructive border-destructive/30 bg-destructive/10",
  orange: "text-orange-500 border-orange-500/30 bg-orange-500/10",
};

export function StatBlock({ icon: Icon, label, value, color = "primary" }: StatBlockProps) {
  if (value === undefined || value === null) return null;

  return (
    <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-2", COLOR_CLASSES[color])}>
      <Icon className="h-4 w-4" />
      <div className="flex flex-col">
        <span className="text-lg font-display font-bold">{value}</span>
        <span className="text-[10px] font-mono uppercase tracking-widest opacity-70">{label}</span>
      </div>
    </div>
  );
}
