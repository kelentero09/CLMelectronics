"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth";
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
  const [error, setError] = useState<string | null>(forbidden ? "That account does not have admin access." : null);
  const [pending, setPending] = useState(false);

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

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
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
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
