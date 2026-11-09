import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Self-contained server for the VPS image (web/Dockerfile); the shared workspace needs a persistent disk.
  output: "standalone",
  async rewrites() {
    const apiOrigin = (process.env.TERMA_API_ORIGIN ?? "https://103-55-36-175.sslip.io").replace(/\/$/, "")

    // Only the public Vercel domain proxies to the VPS. The VPS itself keeps
    // serving /api locally, where account hashes and the workspace are stored.
    return {
      beforeFiles: [{
        source: "/api/:path*",
        has: [{ type: "host", value: "www.terma-app.id" }],
        destination: `${apiOrigin}/api/:path*`,
      }],
      afterFiles: [],
      fallback: [],
    }
  },
};

export default nextConfig;
