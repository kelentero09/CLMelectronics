"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { safeNext } from "@/lib/safe-redirect";

export default function ConfirmPage() {
  return (
    <Suspense fallback={<Finishing />}>
      <ConfirmHandler />
    </Suspense>
  );
}

function Finishing() {
  return (
    <div className="mx-auto max-w-md px-4 py-14 text-center text-sm text-slate-600" role="status">
      Finishing sign-in…
    </div>
  );
}

function ConfirmHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = safeNext(searchParams.get("next"), "/admin");
    const hash = window.location.hash.startsWith("#") ? window.location.hash.slice(1) : "";
    const params = new URLSearchParams(hash);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token") ?? "";

    // Remove tokens from the address bar / history immediately.
    window.history.replaceState(null, "", window.location.pathname + window.location.search);

    if (!access_token) {
      router.replace(next);
      return;
    }
    createSupabaseBrowserClient()
      .auth.setSession({ access_token, refresh_token })
      .then(({ error }) => {
        router.replace(error ? "/login?error=link_invalid" : next);
      })
      .catch(() => router.replace("/login?error=link_invalid"));
  }, [router, searchParams]);

  return <Finishing />;
}
