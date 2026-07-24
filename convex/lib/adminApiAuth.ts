function timingSafeEqualString(a: string, b: string): boolean {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const len = Math.max(aBytes.length, bBytes.length);
  let mismatch = aBytes.length ^ bBytes.length;
  for (let i = 0; i < len; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return mismatch === 0;
}

export function timingSafeEqualAdminKey(a: string, b: string): boolean {
  return timingSafeEqualString(a, b);
}

export function assertAdminApiKeyFromRequest(req: Request): void {
  const expected = process.env.ADMIN_API_KEY;
  if (!expected) {
    throw new Error("ADMIN_API_KEY environment variable not set");
  }

  const header = req.headers.get("authorization") ?? "";
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? "";
  const fallback = req.headers.get("x-admin-api-key")?.trim() ?? "";
  const provided = bearer || fallback;

  if (!provided || !timingSafeEqualString(provided, expected)) {
    throw new Error("Invalid admin API key");
  }
}

export function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
