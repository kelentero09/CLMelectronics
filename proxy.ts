import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Protects /admin/* — unauthenticated users go to /login.
 * Uses getClaims() (local JWT verification with asymmetric keys, no auth-server
 * round-trip in the common case). Role (ADMIN) is still enforced server-side in
 * lib/authz.ts on every page/action.
 */
function toLogin(request: NextRequest, clearCookies = false) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
  const res = NextResponse.redirect(loginUrl);
  if (clearCookies) {
    for (const c of request.cookies.getAll()) {
      if (c.name.startsWith("sb-")) res.cookies.delete(c.name);
    }
  }
  return res;
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    if (process.env.NODE_ENV === "production") return toLogin(request);
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  try {
    const { data, error } = await supabase.auth.getClaims();
    if (error || !data?.claims?.sub) {
      const msg = error?.message ?? "";
      return toLogin(request, /refresh[_ ]token/i.test(msg));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return toLogin(request, /refresh[_ ]token/i.test(msg));
  }
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
