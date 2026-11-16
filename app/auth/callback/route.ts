import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { safeNext } from "@/lib/safe-redirect";

/**
 * Supabase auth callback.
 * - PKCE flow (`?code=`): exchanged server-side, then redirect to a SAFE relative `next`.
 * - Hash flow (`#access_token=`): the fragment never reaches the server, so we
 *   redirect to /auth/confirm (a normal client page using the bundled Supabase
 *   client). Browsers carry the fragment across the redirect.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"), "/admin");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (code && supabaseUrl && supabaseAnonKey) {
    const response = NextResponse.redirect(new URL(next, origin));
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/login?error=link_invalid", origin));
    }
    return response;
  }

  const confirm = new URL("/auth/confirm", origin);
  confirm.searchParams.set("next", next);
  return NextResponse.redirect(confirm);
}
