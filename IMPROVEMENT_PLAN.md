# CLM Catalog: Improvement Plan

**Scope:** security, performance, UI, and transitions/motion
**Stack:** Next.js 16 (App Router, `proxy.ts`), React 19, Prisma 6, Supabase Auth and Storage, Tailwind v4
**Date:** 2026-11-16

Priority key: **P0** = fix before the next deploy · **P1** = high value, do soon · **P2** = nice to have

---

## Implementation status (2026-11-16)

`next build` passes, `eslint` reports 0 errors, and a production smoke test passed: headers, callback redirects, PDF route, admin redirect, invalid filters and every storefront page.

**Done:**
- **Security:** S1–S14.
  - Also fixed one issue that wasn't in the original list: `requestPasswordReset` returned the reset link to *any* caller when SMTP was off, which allowed account takeover.
  - The JSON-LD `</script>` break-out on product pages is fixed.
- **Performance:** P1–P7.
- **UI:** U1–U5 and U7–U12.
  - U12 reordering uses arrow buttons rather than drag-and-drop.
  - U6: tokens were added, but no dark mode.
- **Motion:** T1–T8.

**Not done, needs action from you:**
- **Set `NEXT_PUBLIC_SITE_URL`** to the real `https://` URL in production. Email links now refuse to fall back to request headers.
- **Optionally set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`** so rate limits are shared across serverless instances. Without them, limits are tracked per instance.
- **Check RLS** on every table and the storage policies in the Supabase dashboard.
- **P8 (Web Vitals):** pick an analytics destination, such as Vercel Speed Insights.
- **P9: not changed on purpose.** The board-repair image filenames are stored in database rows, so renaming the files would break existing records.

---

## 1. Security

### Findings

| # | Pri | Issue | Location |
|---|-----|-------|----------|
| S1 | P0 | **XSS in the auth callback HTML.** `next` comes from the query string and is inserted into an inline `<script>` with `JSON.stringify`. That does not escape `</script>`, so `?next=</script><script>alert(1)</script>` runs script on your origin. | `app/auth/callback/route.ts:56` |
| S2 | P0 | **Open redirect.** `` `${origin}${next}` `` with `next=@evil.com` resolves to `https://site@evil.com`. The same problem exists in the server-side code-exchange branch. | `app/auth/callback/route.ts:3,10` |
| S3 | P0 | **Password-reset link poisoning.** If `NEXT_PUBLIC_SITE_URL` is unset or set to localhost in production, `getSiteUrl()` builds the reset and invite link from the request `Host` and `x-forwarded-proto` headers, which an attacker can control. | `app/actions/auth.ts:17`, `app/actions/users.ts:13` |
| S4 | P0 | **Unpinned third-party script on an auth page.** `cdn.jsdelivr.net/npm/@supabase/supabase-js@2` is a floating major version with no SRI, and it runs on a page that handles access tokens. | `app/auth/callback/route.ts:48` |
| S5 | P1 | **Account enumeration with no rate limit.** `requestPasswordReset` says "No admin account found" or "account disabled", and nothing limits how often it can be called. | `app/actions/auth.ts:57-62` |
| S6 | P1 | **Rate limiting doesn't work in production.** The in-memory `Map` resets on every serverless instance and cold start. The IP comes from the first `x-forwarded-for` value, which the client can spoof. | `app/actions/public-inquiries.ts:7` |
| S7 | P1 | **Public spec-sheet PDF action has no limit.** `generateSpecSheet` is CPU-heavy (`@react-pdf`), unauthenticated, and has no rate limit or cache. Someone could use it to exhaust the server. | `app/actions/pdf.ts` |
| S8 | P1 | **No security headers.** There is no CSP, HSTS, `X-Frame-Options`/`frame-ancestors`, `Referrer-Policy`, `X-Content-Type-Options` or `Permissions-Policy`. | `next.config.ts` |
| S9 | P1 | **20 MB server-action body limit.** It applies to every action, including public ones such as the inquiry form, which makes large-payload abuse easy. | `next.config.ts:13` |
| S10 | P1 | **Invite acceptance only checks the first page of users.** `admin.listUsers()` returns 50 users per page. After 50 auth users, existing accounts won't be found and `createUser` will fail. Invite tokens are also stored in plain text. | `app/actions/accept-invite.ts:27`, `app/actions/users.ts` |
| S11 | P2 | **Raw error messages reach the client.** For example `e.message` in `acceptInvite` and Supabase `error.message` in the callback redirect, which reflects text into `/login?error=`. | several |
| S12 | P2 | **Unvalidated enum filters.** `condition` and `availability` from `searchParams` go straight into the Prisma `where`. An invalid value throws, which gives a 500 page and noise in the logs. | `app/(storefront)/products/page.tsx:66-67` |
| S13 | P2 | **`requireAdmin()` is called inside `try/catch` in every action.** The `NEXT_REDIRECT` it throws gets caught and turned into a generic error. That fails closed, but the redirect never happens and the logs get noisy. | `app/actions/*.ts` |
| S14 | P2 | **Build and binary files are committed.** `tsconfig.tsbuildinfo` and `clm.pptx` are tracked in git. | repo root |

### Actions

1. **Make the callback safe (S1, S2, S4).**
   - Add one `safeNext(next)` helper. Accept the value only if it starts with a single `/`, not `//` or `/\`, and contains no `@` before the path. Otherwise fall back to `/admin`.
   - Replace the inline-HTML hash flow with a real client page (`app/auth/confirm/page.tsx`) that uses the bundled `createSupabaseBrowserClient()`. That removes the CDN script and the string-built `<script>` entirely.
   - If the inline HTML stays for now, escape `<`, `>`, `&` and U+2028/U+2029 in the serialized values, and pin plus SRI-hash the CDN script.
2. **Use a fixed canonical URL (S3).** Require `NEXT_PUBLIC_SITE_URL` in production and stop deriving it from request headers. Move `getSiteUrl()` into a single `lib/site-url.ts`; right now it is duplicated in `auth.ts` and `users.ts`. Also keep the Supabase "Redirect URLs" allow-list tight.
3. **Add real rate limiting (S5, S6, S7).** Use Upstash Redis (`@upstash/ratelimit`) or a Postgres-backed limiter keyed on a trusted IP (`x-real-ip` or the platform-provided header). Apply it to `submitInquiry`, `requestPasswordReset`, `acceptInvite`, `generateSpecSheet` and login.
4. **Return a generic reset message (S5).** Always reply "If an admin account exists for that email, a reset link has been sent."
5. **Add security headers (S8)** through `headers()` in `next.config.ts`:
   ```ts
   async headers() {
     return [{ source: "/(.*)", headers: [
       { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
       { key: "X-Content-Type-Options", value: "nosniff" },
       { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
       { key: "X-Frame-Options", value: "DENY" },
       { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
       // Start in Report-Only, then enforce:
       { key: "Content-Security-Policy-Report-Only", value: "default-src 'self'; img-src 'self' data: blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'" },
     ]}];
   }
   ```
6. **Lower the body limit (S9)** to about `5mb`. Images are converted to WebP at 600 px on the server anyway. Validate the file count per upload as well.
7. **Fix invite acceptance (S10).** Look the user up by email with `listUsers` pagination or a `getUserByEmail`-style RPC, or store the Supabase user id on `User`. Store `sha256(token)` in the database and compare the hashes.
8. **Map errors to safe messages (S11).** Return fixed error codes or messages to the client and log the details on the server only.
9. **Validate query params (S12)** with a zod schema in `lib/validators.ts` (`z.enum([...]).optional().catch(undefined)`).
10. **Rethrow redirects (S13).** Call `requireAdmin()` *before* the `try`, or rethrow with `unstable_rethrow(e)` inside the `catch`.
11. **Repo hygiene (S14).** Add `*.tsbuildinfo` to `.gitignore` and remove the tracked copy with `git rm --cached`. Move `clm.pptx` out of the repo.
12. **Ongoing checks.** Turn on Supabase RLS for every table and confirm the storage policies in `prisma/storage-setup.sql`. Run `pnpm audit` in CI. Turn on GitHub Dependabot and secret scanning.

---

## 2. Performance

### Findings

| # | Pri | Issue | Location |
|---|-----|-------|----------|
| P1 | P1 | **Duplicate auth round-trips on every admin request.** `proxy.ts` calls `getUser()` (a network call to Supabase). Then `layout.tsx`, `page.tsx` and every action call `requireAdmin()`, which runs `getUser()` and a Prisma lookup again. Nothing is deduplicated. | `lib/authz.ts`, `proxy.ts` |
| P2 | P1 | **Large, unused images in `public/`.** `logo1.jpg` (1.6 MB), `logo2.jpg` (1.2 MB) and `logo3v1.jpg` (1.5 MB) look unused. `logo3.jpg` (140 KB) is used as the 40 px header logo, favicon and OG image. `logo3.png` is a byte-identical duplicate. `public/` totals 15 MB. | `public/` |
| P3 | P1 | **Inter is declared but never loaded.** The `font-sans` stack falls back to system fonts, so typography differs between operating systems. | `app/globals.css:11` |
| P4 | P1 | **Spec-sheet PDF is rebuilt on every click.** The binary result is also sent back through a server action. | `app/actions/pdf.ts` |
| P5 | P2 | **`/products` is `force-dynamic`.** Every visit, including the unfiltered first page, renders on the server. | `app/(storefront)/products/page.tsx:18` |
| P6 | P2 | **`Reveal` is expensive.** Every wrapped block uses `transition-all` and `will-change-transform` permanently, which creates many compositor layers on long pages. It also adds a timer and an `IntersectionObserver` per block. | `components/storefront/reveal.tsx` |
| P7 | P2 | **Admin and preview images use raw `<img>`.** They get no resizing or AVIF/WebP. | `admin/repairs/page.tsx:99`, `product-images-manager.tsx`, `board-repair-browser.tsx` |
| P8 | P2 | **Text search with `contains` / ILIKE.** It is fine at the current size. Once the catalog grows, confirm that the trigram (`pg_trgm`) GIN indexes the comment mentions really exist in the migrations. | `products/page.tsx:70` |
| P9 | P2 | **Static image filenames contain spaces and parentheses.** For example `Frame Graber Board (Baumer PCI-E44-K02  Rev.C).webp`. These are fragile in URLs and caches. | `public/` |

### Actions

1. **Deduplicate auth per request (P1).** Wrap `getSupabaseUser` and the app-user lookup in React `cache()` so that the layout, page and components share one result per request. In `proxy.ts`, use `supabase.auth.getClaims()` (local JWT verification, no network call) for the "is logged in" check, and keep the full `requireAdmin()` check on the server.
2. **Clean up images (P2, P9).**
   - Delete the unused logos.
   - Generate `app/icon.png` (32 px), `app/apple-icon.png` (180 px) and a 1200×630 `opengraph-image.jpg` using the file-based metadata convention.
   - Use `logo.webp` (7 KB) for the header.
   - Rename static images to kebab-case slugs.
3. **Load the font properly (P3).** Use `next/font/google` (`Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" })`) and point `--font-sans` at `var(--font-inter)`. This is self-hosted, with no layout shift and no external request.
4. **Serve the PDF from a cached route (P4).** Move it to `app/products/[slug]/spec-sheet/route.ts` with `Cache-Control: public, s-maxage=86400, stale-while-revalidate`, tagged and revalidated when the product is updated. Change the button to a plain `<a href download>`, which also removes the client-side Blob work.
5. **Cache the default listing (P5).** Render the unfiltered first page from a cached query (`unstable_cache` / `"use cache"` tagged `catalog`), and only go dynamic when filters are present. Consider enabling `cacheComponents` (PPR) so the shell and filters are static and only the grid streams.
6. **Make `Reveal` lighter (P6).** Use `transition-[opacity,transform]` and drop the permanent `will-change`. Or replace the component with a CSS-only scroll-driven animation (`animation-timeline: view()`) behind `@supports`, with no JavaScript.
7. **Use `next/image` (P7)** for admin thumbnails. For local previews made with `blob:` URLs, keep `<img>`.
8. **Measure.** Add `@vercel/speed-insights` or the `useReportWebVitals` hook, set a budget (LCP < 2.5 s, CLS < 0.1, INP < 200 ms), and run `next build` with `ANALYZE=true` (`@next/bundle-analyzer`) to check the client JavaScript. There are currently about 30 `"use client"` files; push them toward the leaves of the tree where you can.

---

## 3. UI / UX

### Findings and actions

| # | Pri | Item | Action |
|---|-----|------|--------|
| U1 | P1 | **No active state in the navigation.** The header links have no current-page indicator. | Use `usePathname()` to add an active style and `aria-current="page"`. |
| U2 | P1 | **Mobile menu basics.** | Lock body scroll while the menu is open, close it on route change and on `Esc`, move focus to the first link, and return focus to the toggle when it closes. |
| U3 | P1 | **Broken hover effect.** `group-hover:scale-100` does nothing because 100 % is the resting scale. | Change it to `group-hover:scale-105` with `transition-transform`, or remove it. |
| U4 | P1 | **Missing loading states.** Only `/`, `/products` and `/board-repair` have `loading.tsx`. | Add skeletons for `products/[slug]`, `categories/[slug]`, `compare` and the admin pages. Match the real layout to avoid CLS. |
| U5 | P1 | **Form feedback.** | Use `useActionState` / `useFormStatus` for pending buttons, inline field errors from zod, and `aria-invalid` / `aria-describedby`. Inquiry form: show a success state in place of the form, not only a toast. |
| U6 | P2 | **Design tokens.** Colors are partly hard-coded (`#1e293b`, `#2f6fed` in `globals.css`). | Move them into `@theme` tokens (surface, text, border, primary, success, warning, danger) and use those tokens everywhere. This also prepares for an optional dark mode. |
| U7 | P2 | **Product detail page.** | Make the gallery's main image zoomable (lightbox), add a sticky "Inquire" call-to-action on mobile, add "Related products" from the same category, and add breadcrumbs with `BreadcrumbList` JSON-LD. |
| U8 | P2 | **Catalog filtering.** | Show active filters as removable chips, put the result count next to the chips, and use a filter drawer on mobile. Preserve the scroll position when filters change. |
| U9 | P2 | **Empty and error states.** | Give `app/error.tsx` and `not-found.tsx` a "go back" and a search action. Add a product-level `not-found` that suggests similar items. |
| U10 | P2 | **Accessibility pass.** | Check color contrast (for example `text-slate-300` on navy and the `amber-500` badge). Give every image meaningful `alt` text, check 44 px tap targets, and run axe or Lighthouse a11y in CI. |
| U11 | P2 | **SEO.** | Add `Product` JSON-LD on detail pages, `generateMetadata` OG images per product, and canonical URLs for filtered listings. |
| U12 | P2 | **Admin UX.** | Add confirm dialogs for destructive actions, toasts with "Undo" for soft delete, an unsaved-changes guard on the product form, and drag-to-reorder images. |

---

## 4. Transitions and motion

**Goal:** smooth, consistent motion that never blocks the content and respects reduced-motion settings.

| # | Pri | Item | Action |
|---|-----|------|--------|
| T1 | P1 | **Page transitions.** Navigation currently swaps content with a hard cut. | Enable the View Transitions API. In Next 16, set `experimental: { viewTransition: true }` and use React's `<ViewTransition>` around `{children}` in the storefront layout. As a fallback, add `@view-transition { navigation: auto; }` in CSS. Default to a short crossfade (150–200 ms). |
| T2 | P1 | **Shared-element transition from product card to detail.** | Give the card image and the detail hero image the same `view-transition-name: product-${id}`, so the image morphs into place. |
| T3 | P1 | **Respect reduced motion everywhere.** `scroll-behavior: smooth` is unconditional, and `animate-pulse` ignores the setting. | Wrap them in `@media (prefers-reduced-motion: no-preference)`. Add a global rule that turns off animations and transitions for `reduce`. |
| T4 | P2 | **Motion tokens.** | Define them in `@theme`: `--ease-out: cubic-bezier(.2,.8,.2,1)`, `--duration-fast: 150ms`, `--duration-base: 250ms`, `--duration-slow: 500ms`. Replace ad-hoc `duration-300` / `duration-700`. |
| T5 | P2 | **Shorter reveal motion.** Reveals are 700 ms with 32 px offsets, which feels slow when scrolling fast. | Use about 400 ms and about 12–16 px. Cap stagger delays at 200 ms in total, and never hide content that is above the fold on first paint. |
| T6 | P2 | **Micro-interactions.** | Buttons: `active:scale-[.98]`. Cards: lift with `translate-y-[-2px]` and a shadow. Comparison bar: slide up from the bottom when items are added. Mobile menu: slide and fade in place of an instant toggle. |
| T7 | P2 | **Skeleton to content.** | Fade the content in when it replaces a skeleton. Use one shared shimmer style in place of `animate-pulse`. |
| T8 | P2 | **Toasts and dialogs.** | Give Sonner and admin dialogs matching enter and exit easing, using the tokens from T4. |

Suggested global CSS starting point:

```css
@theme {
  --ease-out-soft: cubic-bezier(.2, .8, .2, 1);
  --duration-fast: 150ms;
  --duration-base: 250ms;
}

@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}

::view-transition-old(root),
::view-transition-new(root) {
  animation-duration: var(--duration-base);
  animation-timing-function: var(--ease-out-soft);
}
```

---

## 5. Suggested rollout

| Phase | Contents | Effort |
|-------|----------|--------|
| **1: Hotfix (P0 security)** | S1–S4: callback rewrite, `safeNext`, fixed site URL, remove the CDN script | ~0.5 day |
| **2: Hardening** | S5–S10, S12–S14: rate limiter, headers and CSP (report-only first), body limit, invite fix, enum validation, repo hygiene | 1–2 days |
| **3: Performance** | Auth dedupe with `cache()` and `getClaims`, image cleanup and icons, `next/font`, cached PDF route, lighter `Reveal`, Web Vitals | 1–2 days |
| **4: UI polish** | U1–U5 first, then U6–U12 | 2–3 days |
| **5: Motion** | T3 first (accessibility), then T1/T2 view transitions, then T4–T8 | 1 day |

After each phase, check:
- `pnpm build && pnpm lint` passes.
- A Lighthouse run on `/`, `/products` and `/products/[slug]` (mobile) does not get worse.
- A manual test of login, password reset, invite acceptance, the inquiry form and the PDF download.
- For security phases, check the headers on securityheaders.com and try the callback with a malicious `next` (`/auth/callback?next=@evil.com`).
