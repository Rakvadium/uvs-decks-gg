import { Badge } from "@/components/ui/badge";

export function CreatorProgramHeroBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="neon" className="text-[10px]">
        Creator Program
      </Badge>
      <Badge variant="cyber">Verified Creators</Badge>
      <Badge variant="status">Applications Open</Badge>
    </div>
  );
}
