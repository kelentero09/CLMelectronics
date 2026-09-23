import { Suspense } from "react";
import { prisma } from "@/lib/db";
import AcceptInviteForm from "./accept-form";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ token?: string }> };

export default async function AcceptInvitePage({ searchParams }: Props) {
  const { token } = await searchParams;
  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <h1 className="text-xl font-bold text-navy-900">Invalid invite link</h1>
        <p className="mt-2 text-sm text-slate-600">Missing token. Ask your admin to resend the invite.</p>
      </div>
    );
  }

  let user: { email: string; name: string | null; inviteTokenExpiresAt: Date | null } | null = null;
  try {
    user = await prisma.user.findUnique({
      where: { inviteToken: token },
      select: { email: true, name: true, inviteTokenExpiresAt: true },
    });
  } catch {}

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <h1 className="text-xl font-bold text-navy-900">Invite not found</h1>
        <p className="mt-2 text-sm text-slate-600">This invite link is invalid or was already used. Ask your admin to send a new invite at /admin/users.</p>
      </div>
    );
  }
  if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center">
        <h1 className="text-xl font-bold text-navy-900">Invite expired</h1>
        <p className="mt-2 text-sm text-slate-600">This link expired after 24 hours. Ask your admin to resend it.</p>
      </div>
    );
  }

  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-14 text-sm text-slate-500">Loading…</p>}>
      <AcceptInviteForm token={token} email={user.email} name={user.name} />
    </Suspense>
  );
}
