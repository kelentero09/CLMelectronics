/**
 * Authorization helpers. Authentication (logged in?) vs authorization (ADMIN?).
 * Every admin page and mutation must go through requireAdmin().
 */
import { redirect } from "next/navigation";
import { getSupabaseUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getCurrentAppUser() {
  const supaUser = await getSupabaseUser();
  if (!supaUser?.email) return null;
  try {
    return await prisma.user.findUnique({ where: { email: supaUser.email } });
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const supaUser = await getSupabaseUser();
  if (!supaUser) redirect("/login?redirect=/admin");
  if (!supaUser.email) redirect("/login?redirect=/admin");
  let appUser = null;
  try {
    appUser = await prisma.user.findUnique({ where: { email: supaUser.email! } });
  } catch {
    throw new Error(
      "DATABASE_UNAVAILABLE: cannot verify admin role. Connect Supabase (see SUPABASE_SETUP.md)."
    );
  }
  if (!appUser || appUser.role !== "ADMIN") redirect("/login?error=forbidden");
  return { supaUser, appUser };
}

export async function isAdmin(): Promise<boolean> {
  try {
    const supaUser = await getSupabaseUser();
    if (!supaUser?.email) return false;
    const appUser = await prisma.user.findUnique({ where: { email: supaUser.email } });
    return appUser?.role === "ADMIN";
  } catch {
    return false;
  }
}
