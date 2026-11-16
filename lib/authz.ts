/**
 * Authorization helpers. Authentication (logged in?) vs authorization (ADMIN?).
 * Every admin page and mutation must go through requireAdmin().
 *
 * NOTE: requireAdmin() uses redirect(), which throws. In server actions call it
 * BEFORE any try/catch (or rethrow with unstable_rethrow) so the redirect works.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSupabaseUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** App user for the current request — deduplicated per request via cache(). */
const findAppUser = cache(async (email: string) => {
  return prisma.user.findUnique({ where: { email } });
});

export async function getCurrentAppUser() {
  const supaUser = await getSupabaseUser();
  if (!supaUser?.email) return null;
  try {
    return await findAppUser(supaUser.email);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const supaUser = await getSupabaseUser();
  if (!supaUser?.email) redirect("/login?redirect=/admin");
  let appUser = null;
  try {
    appUser = await findAppUser(supaUser.email);
  } catch {
    throw new Error(
      "DATABASE_UNAVAILABLE: cannot verify admin role. Connect Supabase (see SUPABASE_SETUP.md)."
    );
  }
  if (!appUser || appUser.role !== "ADMIN") redirect("/login?error=forbidden");
  if (appUser.isActive === false) redirect("/login?error=disabled");
  return { supaUser, appUser };
}

export async function isAdmin(): Promise<boolean> {
  try {
    const appUser = await getCurrentAppUser();
    return appUser?.role === "ADMIN" && appUser.isActive !== false;
  } catch {
    return false;
  }
}
