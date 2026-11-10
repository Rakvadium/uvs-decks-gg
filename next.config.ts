import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: multi-host testing on the apex and game subdomains (docs/multi-game.md).
  allowedDevOrigins: ["tcgdecks.localhost", "*.tcgdecks.localhost"],
  // Same-origin fallback for the static card catalog when R2 CORS doesn't list the host
  // (src/lib/universus/static-catalog.ts).
  async rewrites() {
    return [
      {
        source: "/catalog-proxy/:path*",
        destination: "https://pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev/catalog/:path*",
      },
    ];
  },
  async headers() {
    // Auth handoff URLs carry one-time codes / state; never send them as Referer.
    return [
      {
        source: "/auth/:path*",
        headers: [{ key: "Referrer-Policy", value: "no-referrer" }],
      },
    ];
  },
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1440, 1920, 2048, 2560, 3840],
    imageSizes: [64, 96, 128, 256, 384, 512],
    qualities: [75, 95],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
    ],
  },
};

export default nextConfig;
