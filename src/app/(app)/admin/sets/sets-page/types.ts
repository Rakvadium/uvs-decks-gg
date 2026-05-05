import type { Doc } from "../../../../../../convex/_generated/dataModel";

export type AdminSetRow = {
  set: Doc<"sets">;
  actualListCardCount: number;
  mismatch: boolean;
};
