const CORNER = /^rounded-(tl|tr|br|bl)(?:-(.+))?$/;

export type CornerTab = "tab-tl" | "tab-tr";

const DIAGONALS: Record<string, CornerTab> = { "br,tl": "tab-tl", "bl,tr": "tab-tr" };

/**
 * The corner tab a run of class tokens hand-builds: two opposite corners rounded and the other two
 * square, as on a button that sits flush in a card corner. `drop` is every token that built it.
 */
export function cornerTab(tokens: readonly string[]): { shape: CornerTab; drop: string[] } | null {
  const corners = tokens.filter((t) => CORNER.test(t));
  if (corners.length === 0) return null;
  const rounded = new Set(
    corners.flatMap((t) => {
      const [, corner, value] = t.match(CORNER)!;
      return value === "none" ? [] : [corner];
    })
  );
  const shape = DIAGONALS[[...rounded].sort().join(",")];
  if (!shape) return null;
  return { shape, drop: tokens.filter((t) => CORNER.test(t) || t === "rounded-none") };
}
