import path from 'path';
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..'),
  experimental: {
    serverActions: {
      allowedOrigins: ["https://fb-messenger.loca.lt"],
    },
  },
};

export default nextConfig;
