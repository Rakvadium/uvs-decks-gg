import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev",
      },
    ],
  },
};

export default nextConfig;
