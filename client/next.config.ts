import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  // Hide the floating dev indicator that ships with Next.js dev mode.
  // The `appIsrStatus` flag was renamed in Next 15+ and removed entirely
  // in 16; the supported flag now is `position` only.
  devIndicators: {
    position: "bottom-right",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
