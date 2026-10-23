import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const apiUrl = new URL(apiBase);

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets the dev server accept /_next/* requests (HMR) through a Cloudflare quick tunnel.
  allowedDevOrigins: ["*.trycloudflare.com"],
  // Same-origin proxy to the Laravel API, so Sanctum's session cookie works without CORS.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiBase}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
      },
    ],
  },
};

export default nextConfig;
