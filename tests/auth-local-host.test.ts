import { describe, expect, test } from "bun:test";
import { isLocalHost as convexAuthIsLocalHost } from "../node_modules/@convex-dev/auth/dist/server/utils.js";
import { isAuthLocalHost } from "../src/lib/auth-local-host";

describe("isAuthLocalHost", () => {
  test("treats loopback hosts as local", () => {
    expect(isAuthLocalHost("localhost:8090")).toBe(true);
    expect(isAuthLocalHost("127.0.0.1:8090")).toBe(true);
    expect(isAuthLocalHost("[::1]:8090")).toBe(true);
    expect(isAuthLocalHost("localhost")).toBe(true);
  });

  test("treats private LAN IPs as local", () => {
    expect(isAuthLocalHost("192.168.1.24:8090")).toBe(true);
    expect(isAuthLocalHost("10.0.0.8:8090")).toBe(true);
    expect(isAuthLocalHost("172.16.4.2:8090")).toBe(true);
    expect(isAuthLocalHost("169.254.1.1:8090")).toBe(true);
  });

  test("does not treat public hosts as local", () => {
    expect(isAuthLocalHost("uvsdecks.gg")).toBe(false);
    expect(isAuthLocalHost("uvsdecks.gg:443")).toBe(false);
    expect(isAuthLocalHost("8.8.8.8:8090")).toBe(false);
    expect(isAuthLocalHost("172.32.0.1:8090")).toBe(false);
    expect(isAuthLocalHost("")).toBe(false);
  });

  test("patched convex-auth uses the same LAN host rules", () => {
    expect(convexAuthIsLocalHost("192.168.1.24:8090")).toBe(true);
    expect(convexAuthIsLocalHost("localhost:8090")).toBe(true);
    expect(convexAuthIsLocalHost("uvsdecks.gg")).toBe(false);
  });
});
