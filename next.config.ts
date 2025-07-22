import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "export", // 注释此行以支持 API 路由
  distDir: ".next",
  images: {
    domains: ["localhost", "characterapi.sillytarven.top"],
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "characterapi.sillytarven.top",
        port: "",
        pathname: "/**",
      }
    ],
    // 禁用优化器，确保对所有图片URL都不进行处理
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,
};

export default nextConfig;
