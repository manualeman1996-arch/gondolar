import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Allow optional product images from anywhere (placeholders + remote URLs).
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
