import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/site";

// Only the landing page is public; everything under (private) needs a session.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/profile",
          "/notifications",
          "/users",
          "/roles-and-permissions",
          "/system-activities",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
