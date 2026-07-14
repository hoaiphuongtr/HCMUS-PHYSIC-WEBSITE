import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/webp"],
    // Next 16 defaults to qualities:[75] and returns 400 for any other q —
    // legacy body images request q=70 and hero slides q=65.
    qualities: [65, 70, 75],
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

export default withSentryConfig(nextConfig, {
  org: "",
  project: "",
  silent: !process.env.CI,
  widenClientFileUpload: true,
});
