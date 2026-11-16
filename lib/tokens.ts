import { createHash, randomBytes } from "crypto";

/** Random URL-safe token for one-time links. Only its hash is stored. */
export function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** SHA-256 hex of a token — what we persist and look up by. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
