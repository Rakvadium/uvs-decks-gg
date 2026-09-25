import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
