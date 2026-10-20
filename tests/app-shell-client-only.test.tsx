import { describe, expect, mock, test } from "bun:test";
import fs from "node:fs";
import path from "node:path";
import { renderToString } from "react-dom/server";

// The (app) shell renders only the frame that matches matchMedia. That is safe only while the shell
// never renders on the server or during hydration, which AuthGuard guarantees today. These tests
// fail if that stops being true.

const auth = { isLoading: false, isAuthenticated: true };
const realConvexReact = await import("convex/react");
mock.module("convex/react", () => ({ ...realConvexReact, useConvexAuth: () => auth }));
const realNavigation = await import("next/navigation");
const router = { replace: () => {}, push: () => {}, prefetch: () => {}, back: () => {}, forward: () => {}, refresh: () => {} };
mock.module("next/navigation", () => ({
  ...realNavigation,
  useRouter: () => router,
  usePathname: () => "/gallery",
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const { AuthGuard } = await import("../src/components/auth-guard");
const { useShellFrame, SHELL_SERVER_RENDER_ERROR } = await import("../src/components/shell/use-shell-frame");
const { MOBILE_MEDIA_QUERY } = await import("../src/hooks/useIsMobile");
const { default: AppLayout } = await import("../src/app/(app)/layout");

const PAGE_MARKER = "page-rendered-on-server";

function FrameProbe() {
  return <span>{useShellFrame()}</span>;
}

describe("AuthGuard keeps the (app) shell client-only", () => {
  for (const state of [
    { isLoading: true, isAuthenticated: false },
    { isLoading: false, isAuthenticated: false },
    { isLoading: false, isAuthenticated: true },
  ]) {
    test(`renders only the skeleton on the server (isLoading=${state.isLoading}, isAuthenticated=${state.isAuthenticated})`, () => {
      Object.assign(auth, state);
      const html = renderToString(
        <AuthGuard>
          <span>{PAGE_MARKER}</span>
        </AuthGuard>,
      );
      expect(html).not.toContain(PAGE_MARKER);
    });
  }

  test("the real (app) layout server-renders without the shell", () => {
    Object.assign(auth, { isLoading: false, isAuthenticated: true });
    const html = renderToString(
      <AppLayout>
        <span>{PAGE_MARKER}</span>
      </AppLayout>,
    );
    expect(html).not.toContain(PAGE_MARKER);
    expect(html).not.toContain("<main");
  });
});

describe("useShellFrame", () => {
  test("throws instead of guessing a frame on the server", () => {
    expect(() => renderToString(<FrameProbe />)).toThrow(SHELL_SERVER_RENDER_ERROR);
  });

  test("uses the exact complement of Tailwind's md breakpoint", () => {
    const theme = fs.readFileSync(path.join(import.meta.dir, "../node_modules/tailwindcss/theme.css"), "utf8");
    expect(theme).toContain("--breakpoint-md: 48rem;");
    expect(MOBILE_MEDIA_QUERY).toBe("(width < 48rem)");
  });
});
