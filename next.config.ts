import type { NextConfig } from "next";

const nextConfig = {
  typescript:{
    ignoreBuildErrors:true,
  },
  experimental: {
    cacheComponents: true, // Enable the experimental feature flag
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
        permanent: true, // Permanent redirect if needed
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
        permanent: true, // Permanent redirect if needed
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
