import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MobileFiltersButtonProps } from "./types";

export function MobileFiltersButton({ onClick }: MobileFiltersButtonProps) {
  return (
    <Button variant="outline" size="icon" className="h-9 w-9 shrink-0" onClick={onClick}>
      <Filter className="h-4 w-4" />
    </Button>
  );
}
