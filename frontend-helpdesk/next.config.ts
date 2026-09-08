import type { NextConfig } from "next";

const backendBaseUrl =
  process.env.BACKEND_API_BASE_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.2.6",
  ],
  devIndicators: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendBaseUrl}/api/:path*/`,
      },
      {
        source: "/media/:path*",
        destination: `${backendBaseUrl}/media/:path*`,
      },
    ];
  },
};

export default nextConfig;
