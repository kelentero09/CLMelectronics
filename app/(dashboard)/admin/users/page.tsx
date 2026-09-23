import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/authz";
import { UsersManager } from "@/components/dashboard/users-manager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Users — Admin" };

export default async function AdminUsersPage() {
  const { appUser: currentUser } = await requireAdmin();

  let users: Awaited<ReturnType<typeof prisma.user.findMany>> = [];
  let error: string | null = null;
  try {
    users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  } catch (e) {
    console.error("[admin/users] query failed", e);
    error = "Could not load users — database unavailable.";
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Manage Users</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Invite admins by email. Invited users receive an email to set their own password — no one else sees it.
            Only <span className="font-semibold">active ADMINs</span> can see this page.
          </p>
        </div>
      </div>

      {error ? (
        <div className="mt-6 rounded border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
      ) : (
        <UsersManager
          users={users.map((u) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            isActive: u.isActive,
            invitedAt: u.invitedAt ? u.invitedAt.toISOString() : null,
            createdAt: u.createdAt.toISOString(),
          }))}
          currentUserEmail={currentUser.email}
        />
      )}

      <div className="mt-6 rounded border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
        <p className="font-semibold text-slate-700">How invites work</p>
        <ol className="mt-1 list-decimal space-y-1 pl-5">
          <li>Enter email → Invite → Supabase sends a one-time link (check Email Templates → Invite user → Redirect To: <code className="rounded bg-white px-1 py-0.5">/auth/callback</code>).</li>
          <li>Invitee clicks email → sets password on first visit → then logs in at <code className="rounded bg-white px-1 py-0.5">/login</code>.</li>
          <li>Disable = block login but keep record. Remove = delete Prisma row + try to delete Supabase Auth user.</li>
          <li>You cannot disable/remove yourself or the last active admin.</li>
        </ol>
      </div>
    </div>
  );
}
