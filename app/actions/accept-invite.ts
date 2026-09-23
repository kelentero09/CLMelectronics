"use server";

import { prisma } from "@/lib/db";
import { createSupabaseServiceClient } from "@/lib/auth";

export type AcceptInviteResult = { ok: true } | { ok: false; error: string };

export async function acceptInvite(token: string, password: string): Promise<AcceptInviteResult> {
  const t = String(token || "").trim();
  const pw = String(password || "");
  if (!t) return { ok: false, error: "Missing token." };
  if (pw.length < 8) return { ok: false, error: "Password must be at least 8 characters." };
  if (pw.length > 128) return { ok: false, error: "Password is too long." };

  try {
    const user = await prisma.user.findUnique({ where: { inviteToken: t } });
    if (!user) return { ok: false, error: "Invite not found or already used." };
    if (!user.isActive) return { ok: false, error: "Account is disabled." };
    if (user.inviteTokenExpiresAt && user.inviteTokenExpiresAt < new Date()) {
      return { ok: false, error: "Invite expired — ask admin to resend." };
    }

    const supabase = createSupabaseServiceClient();

    // Try to find existing Supabase Auth user by email
    const { data: listData } = await supabase.auth.admin.listUsers();
    const existing = listData.users.find((u) => u.email?.toLowerCase() === user.email.toLowerCase());

    if (existing) {
      const { error: updErr } = await supabase.auth.admin.updateUserById(existing.id, {
        password: pw,
        email_confirm: true,
        user_metadata: user.name ? { name: user.name } : undefined,
      });
      if (updErr) return { ok: false, error: updErr.message };
    } else {
      const { error: createErr } = await supabase.auth.admin.createUser({
        email: user.email,
        password: pw,
        email_confirm: true,
        user_metadata: user.name ? { name: user.name } : undefined,
      });
      if (createErr) return { ok: false, error: createErr.message };
    }

    // Clear token so link is one-time
    await prisma.user.update({
      where: { id: user.id },
      data: { inviteToken: null, inviteTokenExpiresAt: null },
    });

    return { ok: true };
  } catch (e) {
    console.error("[acceptInvite]", e);
    return { ok: false, error: e instanceof Error ? e.message : "Could not set password." };
  }
}
