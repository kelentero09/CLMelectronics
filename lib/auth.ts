/**
 * Supabase clients for the CLM catalog (dedicated CLM Supabase project).
 * Supabase Auth owns credentials; Prisma User stores the application role.
 */
import { createBrowserClient, createServerClient } from "@supabase/ssr";

function getSupabaseConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  }
  return { supabaseUrl, supabaseAnonKey };
}

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = getSupabaseConfig();
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });
}

function isRefreshTokenError(err: unknown): boolean {
  const msg =
    err instanceof Error ? err.message : typeof err === "string" ? err : (err as { message?: string })?.message ?? "";
  return /refresh_token_not_found|refresh token not found|invalid refresh token/i.test(msg);
}

export async function getSupabaseSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      if (isRefreshTokenError(error)) return null;
      return null;
    }
    return data.session;
  } catch (err) {
    if (isRefreshTokenError(err)) return null;
    return null;
  }
}

export async function getSupabaseUser() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      if (isRefreshTokenError(error)) return null;
      return null;
    }
    return data.user;
  } catch (err) {
    if (isRefreshTokenError(err)) return null;
    return null;
  }
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/** Service-role client — server-only, bypasses RLS. Never expose to the browser. */
export function createSupabaseServiceClient() {
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || !serviceKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
