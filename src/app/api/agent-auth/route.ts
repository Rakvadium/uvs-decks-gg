import { NextResponse } from "next/server";
import {
  assertAgentAuthSecret,
  readAgentAuthSecretFromRequest,
} from "@/lib/agent-auth";

export async function POST(request: Request) {
  try {
    let body: unknown = null;
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
      }
    }

    const bodySecret =
      body !== null && typeof body === "object" && !Array.isArray(body)
        ? (body as Record<string, unknown>).secret
        : undefined;

    const secret = readAgentAuthSecretFromRequest(request, bodySecret);
    const credentials = assertAgentAuthSecret(secret);

    return NextResponse.json({
      email: credentials.email,
      password: credentials.password,
      username: credentials.username,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status =
      message.includes("only available") || message.includes("not configured")
        ? 404
        : 401;
    return NextResponse.json({ error: message }, { status });
  }
}
