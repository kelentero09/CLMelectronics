import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/authz";
import { AdminShell } from "@/components/dashboard/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let email = "";
  try {
    const { appUser } = await requireAdmin();
    email = appUser.email;
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("DATABASE_UNAVAILABLE")) {
      return (
        <div className="mx-auto max-w-xl px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-navy-900">Admin unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">
            The database is not connected yet. Follow SUPABASE_SETUP.md to connect Supabase,
            run migrations and seed, then sign in again.
          </p>
        </div>
      );
    }
    throw e;
  }
  if (!email) redirect("/login?redirect=/admin");
  return <AdminShell adminEmail={email}>{children}</AdminShell>;
}
