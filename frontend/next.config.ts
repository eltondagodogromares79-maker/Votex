import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // API requests are proxied via app/api/v1/[...path]/route.ts
  // That route explicitly forwards the Authorization header, which
  // next.config.ts rewrites() would strip on external origins.
};

export default nextConfig;
