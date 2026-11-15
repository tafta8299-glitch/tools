import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Shared hosting (Hostinger) limits how many processes a build may start,
    // so build pages with a single worker. Builds also use webpack
    // (`next build --webpack` in package.json) for the same reason.
    cpus: 1,
  },
};

export default nextConfig;
