import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Gives `next dev` (and build-time prerendering) access to the Cloudflare
// bindings in wrangler.jsonc: D1 (DB), R2 (MEDIA_BUCKET), Images...
// NEXT_DEV_WRANGLER_ENV=local selects the local-only bindings.
initOpenNextCloudflareForDev();

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content Security Policy.
 * - 'unsafe-inline' for scripts is required by Next.js inline bootstrap scripts
 *   unless nonces are used; external script origins are still blocked.
 * - 'unsafe-eval' only in development (React Refresh).
 * - 'wasm-unsafe-eval': the PDF spec sheet is rendered in the browser and its
 *   layout engine (yoga) is WebAssembly.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' data: blob:${isDev ? " ws:" : ""}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ? ["upgrade-insecure-requests"] : []),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
  },
  // Bundled by OpenNext for the workerd runtime (Prisma's WASM engine,
  // worker-mailer's cloudflare:sockets) rather than by Next.js.
  serverExternalPackages: ["@prisma/client", ".prisma/client", "worker-mailer"],
  turbopack: {
    resolveAlias: {
      // The PDF engine only runs in the browser; keep it out of the server
      // bundle so the Worker fits Cloudflare's free-plan size limit.
      "@react-pdf/renderer": {
        browser: "@react-pdf/renderer",
        default: "./lib/pdf/react-pdf-server-stub.ts",
      },
    },
  },
  experimental: {
    serverActions: {
      // Images are downscaled in the browser before upload (lib/client-image.ts)
      // and re-encoded to 600px WebP by the Images binding, so 8 MB is ample.
      bodySizeLimit: "8mb",
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Admin and auth pages must never be stored by shared caches.
      ...["/admin/:path*", "/auth/:path*", "/login"].map((source) => ({
        source,
        headers: [{ key: "Cache-Control", value: "private, no-store" }],
      })),
    ];
  },
};

export default nextConfig;
