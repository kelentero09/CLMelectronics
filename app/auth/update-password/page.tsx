"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createSupabaseBrowserClient } from "@/lib/auth";
import { updatePassword } from "@/app/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-14 text-sm text-slate-500">Loading…</p>}>
      <UpdatePasswordForm />
    </Suspense>
  );
}

function UpdatePasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      try {
        const supabase = createSupabaseBrowserClient();
        // Handle hash fragment flow: #access_token=...&refresh_token=... from Supabase verify
        if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
          const params = new URLSearchParams(window.location.hash.substring(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token") || "";
          if (access_token) {
            try {
              await supabase.auth.setSession({ access_token, refresh_token });
            } catch {}
            // Clean hash from URL
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
        }
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setHasSession(!!data.session);
      } catch {
        if (!cancelled) setHasSession(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    const form = new FormData(e.currentTarget);
    const pw = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (pw.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (pw !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      const res = await updatePassword(pw);
      if (!res.ok) setError(res.error);
      else {
        setInfo(res.message ?? "Password updated. Redirecting…");
        setTimeout(() => {
          router.push("/login");
          router.refresh();
        }, 1200);
      }
    } catch {
      setError("Could not update password.");
    } finally {
      setPending(false);
    }
  }

  if (checking) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 text-center text-sm text-slate-500">Checking reset link…</div>
    );
  }

  if (!hasSession) {
    return (
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <Card>
          <CardContent>
            <h1 className="text-xl font-bold text-navy-900">Reset link invalid</h1>
            <p className="mt-2 text-sm text-slate-600">
              This password reset link is invalid or has expired. Request a new one from the login page.
            </p>
            <Button className="mt-4 w-full" onClick={() => router.push("/login")}>
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="mb-4 flex justify-center">
        <Image src="/logo3.jpg" alt="CLM Electronics logo" width={64} height={64} className="h-16 w-16 rounded object-contain" priority />
      </div>
      <Card>
        <CardContent>
          <h1 className="text-xl font-bold text-navy-900">Set new password</h1>
          <p className="mt-1 text-sm text-slate-500">You’re signed in via the reset link. Choose a new password.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Set new password">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <FieldError message={error} />
            {info && <p className="text-xs font-semibold text-emerald-700">{info}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
