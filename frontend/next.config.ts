import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // API requests are proxied via app/api/v1/[...path]/route.ts
  // That route explicitly forwards the Authorization header, which
  // next.config.ts rewrites() would strip on external origins.
};

export default nextConfig;
