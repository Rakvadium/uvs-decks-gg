export type AuthFlow = "signIn" | "signUp" | "reset";

/** Flows that have their own page (`/sign-in`, `/sign-up`). */
export type AuthEntryFlow = Exclude<AuthFlow, "reset">;

const AUTH_PAGE_PATHS: Record<AuthEntryFlow, string> = {
  signIn: "/sign-in",
  signUp: "/sign-up",
};

/** `/sign-in` or `/sign-up`, with `?next=` unless `next` is the home page or another auth page. */
export function authPageHref(flow: AuthEntryFlow, next: string | null): string {
  const path = AUTH_PAGE_PATHS[flow];
  const nextPathname = next?.split(/[?#]/)[0] ?? "/";
  if (!next || nextPathname === "/" || Object.values(AUTH_PAGE_PATHS).includes(nextPathname)) {
    return path;
  }
  return `${path}?next=${encodeURIComponent(next)}`;
}
