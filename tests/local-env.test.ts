import { describe, expect, test } from "bun:test";
import {
  deploymentKind,
  isLocalConvexEnv,
  pickPort,
  readEnvValue,
  withEnvValue,
  withPort,
} from "../scripts/lib/local-env";

describe("worktree env", () => {
  test("classifies the Convex deployment", () => {
    expect(deploymentKind("CONVEX_DEPLOYMENT=local:local-team-app\n")).toBe("local");
    expect(deploymentKind("CONVEX_DEPLOYMENT=dev:some-cloud-123 # team: x\n")).toBe("cloud");
    expect(deploymentKind("CONVEX_DEPLOYMENT=anonymous:anonymous-agent")).toBe("anonymous");
    expect(deploymentKind("OTHER=1")).toBe("missing");
  });

  test("reads values without inline comments or quotes", () => {
    expect(readEnvValue('A="x"\r\nPORT=8091 # worktree\n', "PORT")).toBe("8091");
    expect(readEnvValue('A="x"\n', "A")).toBe("x");
    expect(readEnvValue("A=1\n", "B")).toBeNull();
  });

  test("sets or replaces PORT", () => {
    expect(withPort("A=1\n", 8092)).toBe("A=1\nPORT=8092\n");
    expect(withPort("A=1\nPORT=8091\nB=2", 8093)).toBe("A=1\nPORT=8093\nB=2");
  });

  test("picks the first untaken worktree port", () => {
    expect(pickPort(new Set([8090]))).toBe(8091);
    expect(pickPort(new Set([8091, 8092]))).toBe(8093);
    expect(pickPort(new Set([8091, 8092, 8093, 8094, 8095, 8096, 8097, 8098, 8099]))).toBeNull();
  });
});

describe("local env guards", () => {
  const local = "CONVEX_DEPLOYMENT=local:local-team-app\nNEXT_PUBLIC_CONVEX_URL=http://127.0.0.1:3210\n";

  test("accepts only a local deployment on a loopback URL", () => {
    expect(isLocalConvexEnv(local)).toBe(true);
    expect(isLocalConvexEnv(local.replace("127.0.0.1:3210", "localhost:3210"))).toBe(true);
    expect(isLocalConvexEnv(local.replace("local:local-team-app", "dev:some-cloud-123"))).toBe(false);
    expect(isLocalConvexEnv(local.replace("http://127.0.0.1:3210", "https://x.convex.cloud"))).toBe(false);
    expect(isLocalConvexEnv("CONVEX_DEPLOYMENT=local:x\n")).toBe(false);
  });

  test("withEnvValue appends or replaces a key", () => {
    expect(withEnvValue("A=1\n", "B", "2")).toBe("A=1\nB=2\n");
    expect(withEnvValue("A=1\nB=old", "B", "new")).toBe("A=1\nB=new");
  });
});
