import type { Id } from "../../../../convex/_generated/dataModel";

export type BuilderTier = {
  id: string;
  label: string;
  color: string;
};

export type BuilderLaneMap = Record<string, Id<"cards">[]>;
