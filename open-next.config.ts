import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Runs the Next.js build on Cloudflare Workers. No incremental cache yet: every
// page on this site is either static (bundled as an asset) or force-dynamic.
export default defineCloudflareConfig({});
