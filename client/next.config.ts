import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Hide the floating dev indicator that ships with Next.js dev mode.
  // The `appIsrStatus` flag was renamed in Next 15+ and removed entirely
  // in 16; the supported flag now is `position` only.
  devIndicators: {
    position: "bottom-left",
  },
  turbopack: {
    root: path.join(process.cwd(), ".."),
  },
  async rewrites() {
    let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";
    // Ensure the API URL is properly formatted to prevent proxy duplication
    if (apiUrl.endsWith("/")) apiUrl = apiUrl.slice(0, -1);
    if (!apiUrl.endsWith("/api")) apiUrl += "/api";

    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
