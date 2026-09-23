"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth";
import { requestPasswordReset } from "@/app/actions/auth";
import { Input, Label, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-md px-4 py-14 text-sm text-slate-500">Loading…</p>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";
  const forbidden = searchParams.get("error") === "forbidden";
  const disabled = searchParams.get("error") === "disabled";
  const initialErr = forbidden
    ? "That account does not have admin access."
    : disabled
      ? "That account has been disabled. Contact an admin."
      : null;
  const [error, setError] = useState<string | null>(initialErr);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [resetPending, setResetPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") || "");
      const password = String(form.get("password") || "");
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
      } else {
        router.push(redirect);
        router.refresh();
      }
    } catch {
      setError("Sign-in is unavailable — Supabase is not connected yet.");
    } finally {
      setPending(false);
    }
  }

  async function handleForgotPassword() {
    setError(null);
    setInfo(null);
    const emailInput = document.getElementById("email") as HTMLInputElement | null;
    const email = emailInput?.value?.trim() ?? "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter your email above first, then click Forgot password.");
      return;
    }
    setResetPending(true);
    try {
      const res = await requestPasswordReset(email);
      if (!res.ok) setError(res.error);
      else setInfo(res.message ?? "Password reset email sent — check your inbox.");
    } catch {
      setError("Could not send reset email.");
    } finally {
      setResetPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="mb-4 flex justify-center">
        <Image
          src="/logo3.jpg"
          alt="CLM Electronics logo"
          width={64}
          height={64}
          className="h-16 w-16 rounded object-contain"
          priority
        />
      </div>
      <Card>
        <CardContent>
          <h1 className="text-xl font-bold text-navy-900">Admin Sign In</h1>
          <p className="mt-1 text-sm text-slate-500">Restricted to authorized CLM administrators.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Admin sign in">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <FieldError message={error} />
            {info && <p className="text-xs font-semibold text-emerald-700">{info}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Signing in…" : "Sign In"}
            </Button>
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={resetPending}
              className="w-full text-center text-xs font-semibold text-steel-600 hover:underline disabled:opacity-50"
            >
              {resetPending ? "Sending reset email…" : "Forgot password?"}
            </button>
          </form>
          <p className="mt-4 text-center text-xs text-slate-500">
            New admin? Ask an existing admin to invite you — you’ll set your own password via email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
