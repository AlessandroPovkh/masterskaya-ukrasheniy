import type { NextConfig } from "next";
import { readLaunchConfig } from "./src/config/launch-gates";

const config = readLaunchConfig(process.env);
const pagesBasePath = process.env.PAGES_BASE_PATH?.replace(/\/$/, "") || "";

const securityHeaders: Pick<NextConfig, "headers"> = config.staticDemo ? {} : {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
          ...(config.mode === "preview" ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] : []),
        ],
      },
    ];
  },
};

const nextConfig: NextConfig = {
  ...(config.staticDemo ? { output: "export", trailingSlash: true, basePath: pagesBasePath } : {}),
  poweredByHeader: false,
  reactStrictMode: true,
  images: { formats: ["image/avif", "image/webp"], unoptimized: config.staticDemo },
  env: { NEXT_PUBLIC_BASE_PATH: pagesBasePath },
  ...securityHeaders,
};

export default nextConfig;
