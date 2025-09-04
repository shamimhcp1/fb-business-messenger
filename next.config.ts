import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow your LocalTunnel host(s) in DEV
  allowedDevOrigins: ["fb-messenger.loca.lt", "*.loca.lt"],

  outputFileTracingRoot: path.join(__dirname, ".."),
  experimental: {
    serverActions: {
      // Keep this for Server Actions POSTs
      allowedOrigins: ["https://fb-messenger.loca.lt"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "platform-lookaside.fbsbx.com",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
      },
    ],
  },
};

export default nextConfig;
