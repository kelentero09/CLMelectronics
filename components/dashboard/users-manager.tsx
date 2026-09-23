"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Input, Label, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, Badge } from "@/components/ui/card";
import { inviteUser, resendInvite, toggleUserActive, removeUser } from "@/app/actions/users";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  isActive: boolean;
  invitedAt: string | null;
  createdAt: string;
};

export function UsersManager({ users, currentUserEmail }: { users: UserRow[]; currentUserEmail: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const form = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await inviteUser(form);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
      } else {
        setSuccess(res.message ?? "Invite sent.");
        toast.success(res.message ?? "Invite sent.");
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  }

  function handleResend(email: string) {
    setError(null);
    startTransition(async () => {
      const res = await resendInvite(email);
      if (!res.ok) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(res.message ?? "Invite resent.");
        router.refresh();
      }
    });
  }

  function handleToggle(user: UserRow) {
    startTransition(async () => {
      const res = await toggleUserActive(user.id, !user.isActive);
      if (!res.ok) {
        toast.error(res.error);
        setError(res.error);
      } else {
        toast.success(res.message ?? "Updated.");
        router.refresh();
      }
    });
  }

  function handleRemove(user: UserRow) {
    if (!confirm(`Remove ${user.email}? They will lose admin access and need a new invite to return.`)) return;
    startTransition(async () => {
      const res = await removeUser(user.id);
      if (!res.ok) {
        toast.error(res.error);
        setError(res.error);
      } else {
        toast.success(res.message ?? "Removed.");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Invite new admin</h2>
          <p className="mt-1 text-xs text-slate-500">
            Only ADMINs can invite. Invite sends an email; the recipient creates their own password. No password is ever shown to you.
          </p>
          <form onSubmit={handleInvite} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" required placeholder="admin@company.com" autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="name">Name (optional)</Label>
              <Input id="name" name="name" type="text" placeholder="Jane Doe" maxLength={120} />
            </div>
            <Button type="submit" disabled={pending} className="sm:mb-0">
              {pending ? "Sending…" : "Send Invite"}
            </Button>
          </form>
          <FieldError message={error} />
          {success && <p className="mt-2 text-xs font-semibold text-emerald-700">{success}</p>}
        </CardContent>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5">User</th>
                <th className="px-4 py-2.5">Role</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Invited / Created</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                    No users yet.
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = u.email.toLowerCase() === currentUserEmail.toLowerCase();
                  return (
                    <tr key={u.id} className={isSelf ? "bg-amber-50/50" : undefined}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-navy-900">
                          {u.email} {isSelf && <span className="ml-1 text-xs font-normal text-slate-500">(you)</span>}
                        </p>
                        <p className="text-xs text-slate-500">{u.name || "—"}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{u.role}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {u.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Disabled</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <span title={u.invitedAt ?? undefined}>{u.invitedAt ? new Date(u.invitedAt).toLocaleDateString() : "—"}</span>
                        <span className="mx-1 text-slate-300">·</span>
                        <span title={u.createdAt}>{new Date(u.createdAt).toLocaleDateString()}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pending || !u.isActive}
                            onClick={() => handleResend(u.email)}
                            title={!u.isActive ? "Enable user first" : "Resend invite email"}
                          >
                            Resend
                          </Button>
                          <Button
                            type="button"
                            variant={u.isActive ? "secondary" : "primary"}
                            size="sm"
                            disabled={pending || isSelf}
                            onClick={() => handleToggle(u)}
                            title={isSelf ? "Cannot change your own status" : undefined}
                          >
                            {u.isActive ? "Disable" : "Enable"}
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={pending || isSelf}
                            onClick={() => handleRemove(u)}
                            title={isSelf ? "Cannot remove yourself" : "Remove user"}
                          >
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
