/**
 * Supabase clients for the CLM catalog (dedicated CLM Supabase project).
 * Supabase Auth owns credentials; Prisma User stores the application role.
 */
import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient, type User } from "@supabase/supabase-js";

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
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component — cookies are read-only there.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

export async function getSupabaseSession() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getSession();
    if (error) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Verified Supabase user for the current request. Wrapped in React `cache()`
 * so layout + page + components share ONE network round-trip per request.
 */
export const getSupabaseUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) return null;
    return data.user;
  } catch {
    return null;
  }
});

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

/**
 * Finds a Supabase Auth user by email, paging through ALL users
 * (listUsers() alone only returns the first page of 50).
 */
export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const supabase = createSupabaseServiceClient();
  const target = email.toLowerCase();
  const perPage = 1000;
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found;
    if (data.users.length < perPage) return null;
  }
  return null;
}
