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
    // Next 16 defaults to qualities:[75] and returns 400 for any other q —
    // legacy body images request q=70 and hero slides q=65.
    qualities: [65, 70, 75],
    // Next 16 also refuses to optimize images fetched from loopback/private IPs.
    // Lift that guard only where the optimizer legitimately fetches a private
    // origin: local builds (API on localhost) and compose deployments that bake an
    // in-network fetch origin. remotePatterns still restricts the reachable hosts.
    dangerouslyAllowLocalIP:
      Boolean(process.env.NEXT_PUBLIC_IMAGE_FETCH_ORIGIN) ||
      (process.env.NEXT_PUBLIC_API_URL ?? "").includes("localhost"),
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
      // In-compose hostname the optimizer fetches media through on the sandbox
      // (containers cannot hairpin to the host's public IP). Never used by browsers.
      {
        protocol: "http",
        hostname: "backend",
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
