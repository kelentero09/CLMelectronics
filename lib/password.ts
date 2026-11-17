/**
 * Password hashing for Better Auth.
 *
 * New hashes: PBKDF2-SHA256 via WebCrypto (native on Workers and Node, so it
 * stays well inside the Worker CPU budget, unlike a pure-JS scrypt/bcrypt).
 * 100,000 iterations is the maximum Workers allows for PBKDF2.
 *
 * Legacy hashes: accounts imported from Supabase Auth keep their bcrypt hash
 * ("$2a$..."), so existing admins can sign in with their current password.
 * The sign-in action upgrades them to PBKDF2 (see needsRehash).
 *
 * Format: pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>
 */
const SCHEME = "pbkdf2-sha256";
const ITERATIONS = 100_000;
const KEY_BYTES = 32;

function toB64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromB64(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations },
    key,
    KEY_BYTES * 8
  );
  return new Uint8Array(bits);
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, ITERATIONS);
  return `${SCHEME}$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  if (!hash) return false;
  if (/^\$2[aby]\$\d{2}\$/.test(hash)) {
    const bcrypt = await import("bcryptjs");
    return bcrypt.compare(password, hash);
  }
  const [scheme, iterRaw, saltB64, hashB64] = hash.split("$");
  const iterations = Number(iterRaw);
  if (scheme !== SCHEME || !Number.isInteger(iterations) || iterations < 1 || iterations > ITERATIONS) return false;
  try {
    const actual = await derive(password, fromB64(saltB64), iterations);
    return timingSafeEqual(actual, fromB64(hashB64));
  } catch {
    return false;
  }
}

/** True for hashes that should be replaced with a current PBKDF2 hash after a successful sign-in. */
export function needsRehash(hash: string | null | undefined): boolean {
  return !!hash && !hash.startsWith(`${SCHEME}$${ITERATIONS}$`);
}
