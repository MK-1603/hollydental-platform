import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://hollydental-platform.vercel.app";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
