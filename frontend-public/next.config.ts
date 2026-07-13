import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    resolveAlias: {
      "@admin": path.resolve(__dirname, "../frontend/src"),
    },
  },
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "103.88.121.212",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "3001",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "phys.hcmus.edu.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "hcmus.edu.vn",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.hcmus.edu.vn",
        pathname: "/**",
      },
    ],
    unoptimized: process.env.NEXT_PUBLIC_IMAGES_UNOPTIMIZED === "true",
  },
};

export default nextConfig;
