/**
 * Server-side stand-in for @react-pdf/renderer (see `turbopack.resolveAlias`
 * in next.config.ts). PDFs are only rendered in the browser, but the bundler
 * still compiles client components for SSR; without this alias the whole PDF
 * engine (~2 MB: fontkit, pdfkit, yoga…) would be shipped in the Worker,
 * pushing it over Cloudflare's size limit. Nothing here is ever called.
 */
const Noop = () => null;

export const Document = Noop;
export const Page = Noop;
export const View = Noop;
export const Text = Noop;
export const Image = Noop;
export const Link = Noop;
export const StyleSheet = { create: <T,>(styles: T): T => styles };

export function pdf(): never {
  throw new Error("PDF rendering is only available in the browser.");
}
