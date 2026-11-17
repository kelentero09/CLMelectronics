import { getAuth } from "@/lib/auth";

/**
 * Better Auth HTTP endpoints. The app itself signs in/out through server
 * actions (app/actions/auth.ts); this route mainly serves the password-reset
 * link (/api/auth/reset-password/:token → /auth/update-password?token=...).
 */
export async function GET(request: Request) {
  return getAuth().handler(request);
}

export async function POST(request: Request) {
  return getAuth().handler(request);
}
