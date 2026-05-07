import type { NextConfig } from "next";

const isStaticBuild = !!process.env.NEXT_STATIC_BUILD;

const nextConfig: NextConfig = isStaticBuild
    ? { output: "export", trailingSlash: true }
    : {
          trailingSlash: true,
          async rewrites() {
              const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3001";
              return [
                  { source: "/api/:path*", destination: `${backendUrl}/api/:path*` },
                  { source: "/auth/:path*", destination: `${backendUrl}/auth/:path*` },
              ];
          },
      };

export default nextConfig;
