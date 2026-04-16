import { Badge } from "@/components/ui/badge";

export function CreatorProgramHeroBadges() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge tone="signal" className="text-[10px]">
        Creator Program
      </Badge>
      <Badge tone="entity">Verified Creators</Badge>
      <Badge variant="status">Applications Open</Badge>
    </div>
  );
}
