import { NextResponse } from "next/server";

const AUTH_COOKIE_NAMES = [
  "__convexAuthJWT",
  "__convexAuthRefreshToken",
  "__convexAuthOAuthVerifier",
  "__Host-__convexAuthJWT",
  "__Host-__convexAuthRefreshToken",
  "__Host-__convexAuthOAuthVerifier",
] as const;

export async function POST(request: Request) {
  const url = new URL(request.url);
  const isHttps = url.protocol === "https:";

  const response = NextResponse.json({ ok: true });

  for (const name of AUTH_COOKIE_NAMES) {
    response.cookies.set(name, "", {
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: name.startsWith("__Host-") ? true : isHttps,
    });
  }

  return response;
}
