type GateEnv = Partial<Record<"NODE_ENV" | "VERCEL_ENV", string | undefined>>;

/**
 * `/design` (the design-system catalog) is for the project owner and agents: on in `next dev` and
 * on Vercel preview deployments, off (404) everywhere else, including production.
 */
export function isDesignCatalogEnabled(env: GateEnv = process.env): boolean {
  return env.NODE_ENV === "development" || env.VERCEL_ENV === "preview";
}
