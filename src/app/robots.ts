import type { MetadataRoute } from "next";
import { launchConfig } from "@/config/launch-gates";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return launchConfig.mode === "production"
    ? { rules: { userAgent: "*", allow: "/" }, sitemap: `${launchConfig.origin}/sitemap.xml` }
    : { rules: { userAgent: "*", disallow: "/" } };
}
