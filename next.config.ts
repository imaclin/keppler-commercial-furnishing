import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /tables shipped in an earlier version of the catalog. The site sells
      // chairs only now, so keep old links alive instead of 404ing them.
      { source: '/tables', destination: '/chairs', permanent: true },
    ];
  },
};

export default nextConfig;
