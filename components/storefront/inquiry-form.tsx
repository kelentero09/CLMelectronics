"use client";

import { useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitInquiry } from "@/app/actions/public-inquiries";
import { Input, Textarea, Label, FieldError } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Keep in sync with inquirySchema in lib/validators.ts
const LIMITS = { name: 50, company: 50, email: 255, phone: 20, message: 500 } as const;

export function InquiryForm({
  productId,
  productLabel,
  compact = false,
}: {
  productId?: string | null;
  productLabel?: string | null;
  compact?: boolean;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);
  const [messageLength, setMessageLength] = useState(0);

  // onSubmit (not form `action`) so React does not reset the user's input on a server-side error.
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setPending(true);
    try {
      const result = await submitInquiry(new FormData(e.currentTarget));
      if (result.ok) {
        setSent(true);
      } else {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
        const first = Object.keys(result.fieldErrors ?? {})[0];
        if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      }
    } catch {
      setError("Could not send your inquiry. Please try again later.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <Card className="animate-fade-up">
        <CardContent className="py-8 text-center" role="status" aria-live="polite">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden />
          <p className="mt-3 text-lg font-bold text-navy-900">Inquiry received</p>
          <p className="mt-1 text-sm text-slate-600">
            Thank you. CLM Electronics Engineering Services will get back to you.
          </p>
          <button
            type="button"
            onClick={() => {
              setSent(false);
              setMessageLength(0);
            }}
            className="mt-4 text-sm font-semibold text-steel-600 hover:underline"
          >
            Send another inquiry
          </button>
        </CardContent>
      </Card>
    );
  }

  const fieldProps = (name: string) => ({
    "aria-invalid": fieldErrors[name] ? true : undefined,
    "aria-describedby": fieldErrors[name] ? `inq-${name}-error` : undefined,
  });
  const fieldError = (name: string) =>
    fieldErrors[name] ? (
      <p id={`inq-${name}-error`} className="mt-1 text-xs font-medium text-red-600">
        {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <Card>
      <CardContent>
        <h2 className="text-lg font-bold text-navy-900">
          {productLabel ? `Inquire About This Product` : "Send a General Inquiry"}
        </h2>
        {productLabel && <p className="mt-1 text-sm text-slate-500">{productLabel}</p>}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`mt-4 grid gap-4 ${compact ? "" : "sm:grid-cols-2"}`}
          aria-label="Inquiry form"
          aria-busy={pending}
        >
          {productId && <input type="hidden" name="productId" value={productId} />}
          {/* Honeypot: humans leave this empty */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <div>
            <Label htmlFor="inq-name">Name *</Label>
            <Input id="inq-name" name="name" required minLength={2} maxLength={LIMITS.name} autoComplete="name" placeholder="Your full name" {...fieldProps("name")} />
            {fieldError("name")}
          </div>
          <div>
            <Label htmlFor="inq-company">Company</Label>
            <Input id="inq-company" name="company" maxLength={LIMITS.company} autoComplete="organization" placeholder="Company name" {...fieldProps("company")} />
            {fieldError("company")}
          </div>
          <div>
            <Label htmlFor="inq-email">Email *</Label>
            <Input id="inq-email" name="email" type="email" required maxLength={LIMITS.email} autoComplete="email" placeholder="you@company.com" {...fieldProps("email")} />
            {fieldError("email")}
          </div>
          <div>
            <Label htmlFor="inq-phone">Phone</Label>
            <Input id="inq-phone" name="phone" type="tel" maxLength={LIMITS.phone} autoComplete="tel" placeholder="+63 ..." {...fieldProps("phone")} />
            {fieldError("phone")}
          </div>
          <div className={compact ? "" : "sm:col-span-2"}>
            <div className="flex items-baseline justify-between">
              <Label htmlFor="inq-message">Message * (min 10 characters)</Label>
              <span className={`text-xs tabular-nums ${messageLength > LIMITS.message - 50 ? "text-amber-700" : "text-slate-500"}`} aria-live="polite">
                {messageLength}/{LIMITS.message}
              </span>
            </div>
            <Textarea
              id="inq-message"
              name="message"
              required
              minLength={10}
              maxLength={LIMITS.message}
              rows={5}
              placeholder="Product reference, quantity needed, application, timeline…"
              onChange={(e) => setMessageLength(e.target.value.length)}
              {...fieldProps("message")}
            />
            {fieldError("message")}
          </div>
          {Object.keys(fieldErrors).length === 0 && <FieldError message={error} />}
          <div className={compact ? "" : "sm:col-span-2"}>
            <Button type="submit" disabled={pending} className="w-full sm:w-auto sm:px-10">
              {pending ? "Sending…" : "Request Information"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
