/**
 * Authorization helpers. Authentication (logged in?) vs authorization (ADMIN?).
 * Every admin page and mutation must go through requireAdmin().
 *
 * NOTE: requireAdmin() uses redirect(), which throws. In server actions call it
 * BEFORE any try/catch (or rethrow with unstable_rethrow) so the redirect works.
 */
import { cache } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** App user for the current request — deduplicated per request via cache(). */
const findAppUser = cache(async (id: string) => {
  return prisma.user.findUnique({ where: { id } });
});

export async function getCurrentAppUser() {
  const authUser = await getAuthUser();
  if (!authUser) return null;
  try {
    return await findAppUser(authUser.id);
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login?redirect=/admin");
  let appUser = null;
  try {
    appUser = await findAppUser(authUser.id);
  } catch {
    throw new Error("DATABASE_UNAVAILABLE: cannot verify admin role. Check the D1 binding (see CLOUDFLARE_SETUP.md).");
  }
  if (!appUser || appUser.role !== "ADMIN") redirect("/login?error=forbidden");
  if (appUser.isActive === false) redirect("/login?error=disabled");
  return { authUser, appUser };
}

export async function isAdmin(): Promise<boolean> {
  try {
    const appUser = await getCurrentAppUser();
    return appUser?.role === "ADMIN" && appUser.isActive !== false;
  } catch {
    return false;
  }
}
