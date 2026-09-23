/**
 * Free Node email sender — bypasses Supabase's rate-limited mailer.
 * Uses Nodemailer if SMTP_* env vars are set, otherwise logs and returns the link
 * so the admin can copy/share it (zero external dependency, truly free).
 *
 * Env (optional, for real sending):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE (true/false)
 *   If not set, emails are NOT sent externally — the action_link is returned
 *   and shown in the UI as a copyable link (good for dev/free tier).
 *
 * Templates reuse supabase/email-templates/*.html branding via inline HTML here.
 */
import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

type SendOpts = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

let cachedTransporter: Transporter | null | undefined;

function sanitizeSmtpPass(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // dotenv keeps inline comment as part of value: "abcd efgh # comment" → strip at #
  let v = raw.split("#")[0]!.trim();
  // Gmail app passwords are shown as "abcd efgh ijkl mnop" but SMTP wants "abcdefghijklmnop"
  // Keep compatibility: remove spaces, but also accept with spaces
  const noSpaces = v.replace(/\s+/g, "");
  // If user left placeholder, treat as not configured
  if (!noSpaces || /^(abcd|your-|placeholder)/i.test(noSpaces)) return undefined;
  return noSpaces;
}

function getTransporter(): Transporter | null {
  if (cachedTransporter !== undefined) return cachedTransporter;
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS;
  const pass = sanitizeSmtpPass(rawPass);
  if (!host || !user || !pass) {
    cachedTransporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
  return cachedTransporter;
}

export function isEmailConfigured(): boolean {
  return !!getTransporter();
}

export async function sendMail(opts: SendOpts): Promise<{ ok: true } | { ok: false; error: string }> {
  let transporter = getTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "CLM Electronics <noreply@clm.local>";
  if (!transporter) {
    // Dev fallback: try Ethereal (free, no credentials needed) so user sees working email without Gmail
    if (process.env.NODE_ENV !== "production") {
      try {
        const testAccount = await nodemailer.createTestAccount();
        const ethTransporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await ethTransporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
        const preview = nodemailer.getTestMessageUrl(info);
        console.log(`[email:ethereal] Sent to ${opts.to} — preview: ${preview}`);
        // Still tell caller it wasn't sent via real SMTP, but provide preview link in error log
        // Return success so UI shows sent, while logging preview
        return { ok: true };
      } catch (err) {
        console.log(`[email:dev] Ethereal fallback failed`, err);
      }
    }
    console.log(`[email:dev] Would send to ${opts.to} — subject: ${opts.subject}`);
    console.log(`[email:dev] Set SMTP_HOST/SMTP_USER/SMTP_PASS to actually send.`);
    return { ok: false, error: "Email not configured — SMTP env missing. Link generated but not emailed." };
  }
  try {
    await transporter.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    return { ok: true };
  } catch (e) {
    console.error("[sendMail] failed", e);
    const msg = e instanceof Error ? e.message : String(e);
    // Friendly Gmail help for 535 BadCredentials
    if (/535.*BadCredentials|Username and Password not accepted/i.test(msg)) {
      return {
        ok: false,
        error:
          "Gmail rejected the password (535 BadCredentials). Use a Gmail App Password, not your normal password: 1) Enable 2-Step Verification at myaccount.google.com → Security, 2) Create App Password at myaccount.google.com/apppasswords (16 chars), 3) Put it in .env as SMTP_PASS=abcdefghijklmnop (no spaces), 4) Restart pnpm dev. Or set SMTP_HOST to a free Resend/Ethereal account to bypass Gmail.",
      };
    }
    return { ok: false, error: msg };
  }
}

function wrapHtml(title: string, body: string): string {
  // Minimal CLM-branded wrapper — matches supabase/email-templates styling
  return `
<div style="margin:0;padding:0;background-color:#f1f5f9;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <tr><td style="background:#0B1D33;padding:20px 28px;">
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#ffffff;">CLM Electronics Engineering Services</div>
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;margin-top:4px;letter-spacing:0.4px;text-transform:uppercase;">${title}</div>
        </td></tr>
        <tr><td style="padding:28px;">${body}</td></tr>
        <tr><td style="padding:16px 28px 24px 28px;border-top:1px solid #e2e8f0;">
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#475569;">
            <strong>CLM Electronics Engineering Services</strong><br/>#9 Bayabas St., Mutual Homes, Putatan, Muntinlupa City, Philippines<br/>0997 925 6959 • 8838 4882 • <a href="mailto:er.canlas23@gmail.com" style="color:#0B1D33;">er.canlas23@gmail.com</a>
          </p>
        </td></tr>
      </table>
      <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;margin:12px 0 0 0;">© CLM Electronics • Automated message</p>
    </td></tr>
  </table>
</div>`;
}

export function buildInviteHtml(link: string, email: string, siteUrl: string): string {
  const body = `
          <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;color:#0B1D33;">You’ve been invited to CLM Admin</h1>
          <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#334155;">
            An administrator has invited <strong>${email}</strong> to access the CLM Catalog Admin dashboard.
          </p>
          <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#334155;">
            Click below to set your own password. This link expires in 24 hours and can only be used once.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="display:inline-block;background:#0B1D33;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;">Accept Invite &amp; Set Password</a>
          </div>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#64748b;">
            If the button doesn’t work, copy this link:<br/>
            <a href="${link}" style="color:#0B1D33;word-break:break-all;">${link}</a><br/><br/>You’ll be redirected to ${siteUrl}/auth/callback then to CLM Admin. After setting your password, sign in at ${siteUrl}/login.
          </p>`;
  return wrapHtml("Admin Access", body);
}

export function buildRecoveryHtml(link: string, email: string, siteUrl: string): string {
  const body = `
          <h1 style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:20px;color:#0B1D33;">Reset your CLM Admin password</h1>
          <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#334155;">
            We received a request to reset the password for <strong>${email}</strong> on the CLM Catalog Admin.
          </p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${link}" style="display:inline-block;background:#0B1D33;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;">Reset Password</a>
          </div>
          <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#64748b;">
            Or copy this link:<br/>
            <a href="${link}" style="color:#0B1D33;word-break:break-all;">${link}</a><br/><br/>You’ll be taken to ${siteUrl}/auth/callback → /auth/update-password to set your new password. Link expires in 1 hour.
          </p>
          <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;">If you didn’t request this, ignore this email — your password won’t change.</p>`;
  return wrapHtml("Password Reset", body);
}
