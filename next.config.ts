import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // 注释此行以支持 API 路由
  distDir: ".next",
  images: {
    domains: ["localhost"],
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
};

export default nextConfig;
