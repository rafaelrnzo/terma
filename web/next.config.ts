import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Self-contained server for the VPS image (web/Dockerfile); the shared workspace needs a persistent disk.
  output: "standalone",
};

export default nextConfig;
