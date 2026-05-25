import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
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
