/**
 * Transactional email (admin invites, password resets) over SMTP.
 *
 * - On Cloudflare Workers: worker-mailer (SMTP over Workers TCP sockets).
 * - In local `next dev` (Node.js): nodemailer, with an Ethereal test inbox
 *   fallback when SMTP isn't configured.
 *
 * Env: SMTP_HOST, SMTP_PORT (465 = TLS, 587 = STARTTLS), SMTP_USER, SMTP_PASS,
 *      SMTP_FROM, SMTP_SECURE (true/false).
 * Without SMTP, nothing is sent; callers fall back to showing a copyable link.
 */

type SendOpts = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string; from: string };

function sanitizeSmtpPass(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  // dotenv keeps an inline comment as part of the value: "abcd efgh # comment"
  const v = raw.split("#")[0]!.trim();
  // Gmail app passwords are shown as "abcd efgh ijkl mnop"; SMTP wants them without spaces.
  const noSpaces = v.replace(/\s+/g, "");
  if (!noSpaces || /^(abcd|your-|placeholder)/i.test(noSpaces)) return undefined;
  return noSpaces;
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = sanitizeSmtpPass(process.env.SMTP_PASS);
  if (!host || !user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = process.env.SMTP_FROM || user;
  return { host, port, secure, user, pass, from };
}

function isWorkersRuntime(): boolean {
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

export function isEmailConfigured(): boolean {
  return !!getSmtpConfig();
}

async function sendViaWorkers(cfg: SmtpConfig, opts: SendOpts): Promise<void> {
  const { WorkerMailer } = await import("worker-mailer");
  await WorkerMailer.send(
    {
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      startTls: !cfg.secure,
      credentials: { username: cfg.user, password: cfg.pass },
      authType: ["plain", "login"],
      socketTimeoutMs: 15_000,
      responseTimeoutMs: 15_000,
    },
    { from: cfg.from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text }
  );
}

async function sendViaNode(cfg: SmtpConfig | null, opts: SendOpts): Promise<"sent" | "ethereal"> {
  // Local `next dev` (Node.js) only — never reached on Workers. Loaded through
  // an opaque runtime import so neither Turbopack nor OpenNext's bundler can
  // see it and copy nodemailer (~270 KB) into the Worker bundle.
  const loadModule = new Function("name", "return import(name)") as (name: string) => Promise<unknown>;
  const nodemailer = ((await loadModule("nodemailer")) as typeof import("nodemailer")).default;
  if (cfg) {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    });
    await transporter.sendMail({ from: cfg.from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
    return "sent";
  }
  // Dev only: Ethereal test inbox (free, no credentials) so the flow can be tried without SMTP.
  const account = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
  const info = await transporter.sendMail({ from: "CLM Electronics <noreply@clm.local>", to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
  console.log(`[email:ethereal] Sent to ${opts.to} — preview: ${nodemailer.getTestMessageUrl(info)}`);
  return "ethereal";
}

function friendlySmtpError(msg: string): string {
  if (/535|BadCredentials|Username and Password not accepted|auth/i.test(msg)) {
    return "The SMTP server rejected the login. For Gmail, use an App Password (myaccount.google.com/apppasswords) as SMTP_PASS, not your normal password.";
  }
  return msg;
}

export async function sendMail(opts: SendOpts): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = getSmtpConfig();
  try {
    if (isWorkersRuntime()) {
      if (!cfg) return { ok: false, error: "Email not configured — SMTP settings missing. Link generated but not emailed." };
      await sendViaWorkers(cfg, opts);
      return { ok: true };
    }
    if (!cfg && process.env.NODE_ENV === "production") {
      return { ok: false, error: "Email not configured — SMTP settings missing. Link generated but not emailed." };
    }
    await sendViaNode(cfg, opts);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[sendMail] failed", msg);
    return { ok: false, error: friendlySmtpError(msg) };
  }
}

function wrapHtml(title: string, body: string): string {
  // Minimal CLM-branded wrapper
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
            <a href="${link}" style="color:#0B1D33;word-break:break-all;">${link}</a><br/><br/>You’ll set your password on ${siteUrl}, then sign in at ${siteUrl}/login.
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
            <a href="${link}" style="color:#0B1D33;word-break:break-all;">${link}</a><br/><br/>You’ll be taken to ${siteUrl}/auth/update-password to set your new password. Link expires in 1 hour.
          </p>
          <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#94a3b8;">If you didn’t request this, ignore this email — your password won’t change.</p>`;
  return wrapHtml("Password Reset", body);
}
