import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  assertAgentAuthSecret,
  getAgentAuthCredentials,
  isAgentAuthEnabled,
  readAgentAuthSecretFromRequest,
} from "../src/lib/agent-auth";
import { sanitizeAgentLoginNextPath } from "../src/lib/agent-auth-shared";

const KEYS = [
  "NODE_ENV",
  "VERCEL",
  "AGENT_AUTH_SECRET",
  "AGENT_AUTH_EMAIL",
  "AGENT_AUTH_PASSWORD",
  "AGENT_AUTH_USERNAME",
] as const;

let previous: Record<string, string | undefined> = {};

function setEnv(key: (typeof KEYS)[number], value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env[key];
  else env[key] = value;
}

function setDevAgentEnv(overrides?: Partial<Record<(typeof KEYS)[number], string>>) {
  setEnv("NODE_ENV", "development");
  setEnv("VERCEL", undefined);
  setEnv("AGENT_AUTH_SECRET", "test-agent-secret");
  setEnv("AGENT_AUTH_EMAIL", "agent@localhost.dev");
  setEnv("AGENT_AUTH_PASSWORD", "AgentDev1");
  setEnv("AGENT_AUTH_USERNAME", "agent");
  if (overrides) {
    for (const [key, value] of Object.entries(overrides) as Array<
      [(typeof KEYS)[number], string]
    >) {
      setEnv(key, value);
    }
  }
}

describe("agent-auth", () => {
  beforeEach(() => {
    previous = {};
    for (const key of KEYS) {
      previous[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of KEYS) {
      setEnv(key, previous[key]);
    }
  });

  test("isAgentAuthEnabled only in local development", () => {
    setDevAgentEnv();
    expect(isAgentAuthEnabled()).toBe(true);

    setEnv("NODE_ENV", "production");
    expect(isAgentAuthEnabled()).toBe(false);

    setDevAgentEnv({ VERCEL: "1" });
    expect(isAgentAuthEnabled()).toBe(false);
  });

  test("getAgentAuthCredentials requires configured password rules", () => {
    setDevAgentEnv();
    expect(getAgentAuthCredentials()).toEqual({
      email: "agent@localhost.dev",
      password: "AgentDev1",
      username: "agent",
    });

    setDevAgentEnv({ AGENT_AUTH_PASSWORD: "short" });
    expect(getAgentAuthCredentials()).toBeNull();
  });

  test("assertAgentAuthSecret rejects bad secrets", () => {
    setDevAgentEnv();
    expect(assertAgentAuthSecret("test-agent-secret").email).toBe("agent@localhost.dev");
    expect(() => assertAgentAuthSecret("wrong")).toThrow("Invalid agent auth secret");
  });

  test("readAgentAuthSecretFromRequest prefers bearer then header then body", () => {
    const bearerReq = new Request("http://localhost/api/agent-auth", {
      headers: { authorization: "Bearer from-header" },
    });
    expect(readAgentAuthSecretFromRequest(bearerReq, "from-body")).toBe("from-header");

    const customReq = new Request("http://localhost/api/agent-auth", {
      headers: { "x-agent-auth-secret": "from-custom" },
    });
    expect(readAgentAuthSecretFromRequest(customReq, "from-body")).toBe("from-custom");

    const bodyReq = new Request("http://localhost/api/agent-auth");
    expect(readAgentAuthSecretFromRequest(bodyReq, "from-body")).toBe("from-body");
  });

  test("sanitizeAgentLoginNextPath blocks open redirects", () => {
    expect(sanitizeAgentLoginNextPath("/gallery")).toBe("/gallery");
    expect(sanitizeAgentLoginNextPath("//evil.com")).toBe("/home");
    expect(sanitizeAgentLoginNextPath("https://evil.com")).toBe("/home");
    expect(sanitizeAgentLoginNextPath(undefined)).toBe("/home");
  });
});
