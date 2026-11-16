import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/tokens";

/**
 * Looks up an invite by its token. New invites store only sha256(token);
 * the plaintext fallback keeps links issued before hashing working until they expire.
 */
export async function findUserByInviteToken(token: string) {
  const t = String(token || "").trim();
  if (!t || t.length > 128 || !/^[a-f0-9]+$/i.test(t)) return null;
  return (
    (await prisma.user.findUnique({ where: { inviteToken: hashToken(t) } })) ??
    (await prisma.user.findUnique({ where: { inviteToken: t } }))
  );
}
