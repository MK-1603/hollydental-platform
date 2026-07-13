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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "media.istockphoto.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "www.hollyhilldental.ie" },
      { protocol: "https", hostname: "hollyhilldental.ie" },
    ],
  },
};

export default nextConfig;
