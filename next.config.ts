import type { NextConfig } from "next";

const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
const apiUrl = new URL(apiBase);

const nextConfig: NextConfig = {
  output: "standalone",
  // Lets the dev server accept /_next/* requests (HMR) from other devices: a Cloudflare quick tunnel,
  // this machine's LAN address and its ZeroTier address (the hosts in SANCTUM_STATEFUL_DOMAINS).
  allowedDevOrigins: ["*.trycloudflare.com", "192.168.30.15", "10.49.160.210"],
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
