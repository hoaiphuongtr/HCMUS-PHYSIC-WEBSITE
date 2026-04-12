import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    resolveAlias: {
      "@admin": path.resolve(__dirname, "../frontend/src"),
    },
  },
};

export default nextConfig;
