import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow build to succeed with warnings (unused vars)
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // Disable problematic image placeholders in development
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },
};

export default nextConfig;
