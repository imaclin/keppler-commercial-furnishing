import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` reach Cloudflare bindings (the same env the Worker sees), so
// local development and the deployed app read configuration the same way.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // pg loads its Workers socket shim (pg-cloudflare) only at runtime, behind a
  // check for the Workers user agent, so Next's file tracing never sees the
  // require and leaves the package out of the server bundle. Pull it in by hand.
  outputFileTracingIncludes: {
    '/*': ['./node_modules/pg-cloudflare/**/*'],
  },
  async redirects() {
    return [
      // /tables shipped in an earlier version of the catalog. The site sells
      // chairs only now, so keep old links alive instead of 404ing them.
      { source: '/tables', destination: '/chairs', permanent: true },
    ];
  },
};

export default nextConfig;
