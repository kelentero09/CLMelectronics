import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin";
  // Supabase invite/recovery links use `code` PKCE flow; exchange for session then redirect.
  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnonKey) {
      const response = NextResponse.redirect(`${origin}${next}`);
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            // Parse cookies from the incoming request
            const cookieHeader = request.headers.get("cookie") ?? "";
            return cookieHeader
              .split(";")
              .map((c) => c.trim())
              .filter(Boolean)
              .map((c) => {
                const eq = c.indexOf("=");
                return { name: c.slice(0, eq), value: c.slice(eq + 1) };
              });
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
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`);
      }
      return response;
    }
  }
  // Fallback: hash flow (Supabase verify redirect with #access_token) — hash never reaches server,
  // so we must serve a page that handles it client-side. Return HTML that bootstraps Supabase browser client.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseAnonKey) {
    const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>CLM — Finishing sign-in…</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head><body style="font-family:Arial,sans-serif;padding:40px;text-align:center;color:#334155">
<p>Finishing sign-in…</p>
<script>
(function(){
  try{
    var hash = window.location.hash || "";
    var search = window.location.search || "";
    var next = ${JSON.stringify(next)};
    var origin = ${JSON.stringify(origin)};
    // If hash contains access_token (invite/recovery verify), let Supabase JS parse it
    if(hash && hash.indexOf("access_token")>-1){
      var supabase = window.supabase.createClient(${JSON.stringify(supabaseUrl)}, ${JSON.stringify(supabaseAnonKey)});
      // supabase-js v2 will auto-detect hash on auth.getSession(), but we explicitly set session from hash
      var params = new URLSearchParams(hash.substring(1));
      var access_token = params.get("access_token");
      var refresh_token = params.get("refresh_token");
      if(access_token){
        supabase.auth.setSession({access_token: access_token, refresh_token: refresh_token || ""}).then(function(){
          window.location.replace(origin + next);
        }).catch(function(){ window.location.replace(origin + "/login?error=" + encodeURIComponent("Invalid link"));});
        return;
      }
    }
    // No hash — check for code fallback or just redirect
    if(search.indexOf("code=")>-1){
      // Let server handle code exchange — reload to same URL with code
      window.location.replace(window.location.href);
      return;
    }
    window.location.replace(origin + next);
  }catch(e){ window.location.replace(${JSON.stringify(origin)} + "/login?error=" + encodeURIComponent(String(e && e.message || e))); }
})();
</script></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
  }
  return NextResponse.redirect(`${origin}${next}`);
}
