import { MetadataRoute } from "next";

const siteUrl = "https://qrezo.stackhaus.dev";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/pricing", "/create", "/login", "/signup"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
          "/auth/", // In case there are auth callbacks
          "/my-qrs/", // Private
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}



