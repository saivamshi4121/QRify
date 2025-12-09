import { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://qrify.app";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteUrl.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/create",
          "/pricing",
          "/login",
          "/signup",
          "/embed/",
          "/api/qr/embed/",
          "/api/qr/redirect/",
        ],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/auth/",
          "/api/admin/",
          "/api/user/",
          "/api/qr/generate",
          "/api/qr/delete/",
          "/api/qr/update-link/",
          "/api/qr/stats/",
          "/api/qr/preview",
          "/api/qr/upload-logo",
          "/api/qrs",
          "/api/dashboard/",
          "/api/payments/",
          "/settings/",
          "/qrs/",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/create",
          "/pricing",
          "/embed/",
          "/api/qr/embed/",
          "/api/qr/redirect/",
        ],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/api/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
