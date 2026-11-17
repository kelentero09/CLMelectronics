import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/**
 * No Next.js cache storage is configured (it would need R2 or KV): pages are
 * rendered on each request straight from D1, which is fast at this size and
 * means admin edits show up immediately. `revalidate` / `unstable_cache` /
 * `updateTag` become no-ops on Cloudflare.
 * To add caching later: https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig({});
