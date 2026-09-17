import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Speed: lean production headers, compressed responses, modern image
  // formats with long CDN cache for static assets.
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
