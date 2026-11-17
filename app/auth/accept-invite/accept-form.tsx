"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { acceptInvite } from "@/app/actions/accept-invite";
import { Input, Label, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function AcceptInviteForm({ token, email, name }: { token: string; email: string; name: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setPending(true);
    try {
      // Saves the password, clears the one-time token and signs in (sets the session cookie).
      const res = await acceptInvite(token, password);
      if (!res.ok) {
        setError(res.error);
      } else {
        router.push(res.signedIn ? "/admin" : "/login?invite=accepted");
        router.refresh();
      }
    } catch {
      setError("Could not set password.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="mb-4 flex justify-center">
        <Image src="/logo3.jpg" alt="CLM Electronics logo" width={64} height={64} className="h-16 w-16 rounded object-contain" priority />
      </div>
      <Card>
        <CardContent>
          <h1 className="text-xl font-bold text-navy-900">Set your CLM password</h1>
          <p className="mt-1 text-sm text-slate-600">
            Invited as <strong>{email}</strong>
            {name ? ` (${name})` : ""}. Choose a password — you’ll sign in at <span className="font-mono text-xs">/login</span> afterwards.
          </p>
          <p className="mt-1 text-xs text-slate-500">This invite link can be used once and expires 24 hours after it was sent.</p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-label="Set password">
            <div>
              <Label htmlFor="password">New password</Label>
              <Input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm password</Label>
              <Input id="confirm" name="confirm" type="password" required autoComplete="new-password" minLength={8} />
            </div>
            <FieldError message={error} />
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Saving…" : "Set Password & Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
