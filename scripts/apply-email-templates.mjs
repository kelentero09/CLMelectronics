#!/usr/bin/env node
/**
 * Apply CLM-branded Auth email templates to Supabase via Management API.
 *
 * Usage:
 *   1. Create a Supabase Personal Access Token: https://supabase.com/dashboard/account/tokens
 *   2. Run:
 *      SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=wzodnqlugamddmotlrty node scripts/apply-email-templates.mjs
 *   Or with pnpm:
 *      pnpm exec node scripts/apply-email-templates.mjs
 *
 * Without a token the script prints manual instructions (no changes made).
 *
 * Docs: https://api.supabase.com/api/v1#tag/auth-config
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF || process.env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || "wzodnqlugamddmotlrty";
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_PAT;

function loadTemplate(name) {
  const p = resolve(__dirname, `../supabase/email-templates/${name}.html`);
  try { return readFileSync(p, "utf8"); } catch { console.error(`Missing template: ${p}`); process.exit(1); }
}

const templates = {
  invite:   { subject: "You've been invited to CLM Admin — set your password", content: loadTemplate("invite") },
  recovery: { subject: "Reset your CLM Admin password", content: loadTemplate("recovery") },
  confirm:  { subject: "Confirm your CLM Admin email", content: loadTemplate("confirm") },
  magiclink:{ subject: "Your CLM Admin sign-in link", content: loadTemplate("magiclink") },
};

if (!ACCESS_TOKEN) {
  console.log(`
No SUPABASE_ACCESS_TOKEN found — printing manual steps (no API call made).

To make emails say "CLM Electronics" instead of "Supabase Auth":

  1. Go to https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates
  2. For each template below, click Edit, set Subject and paste the HTML from the file:

     - Invite user      → subject: "${templates.invite.subject}"
                          file: supabase/email-templates/invite.html
     - Recovery         → subject: "${templates.recovery.subject}"
                          file: supabase/email-templates/recovery.html
     - Confirm signup   → subject: "${templates.confirm.subject}"
                          file: supabase/email-templates/confirm.html
     - Magic link       → subject: "${templates.magiclink.subject}"
                          file: supabase/email-templates/magiclink.html

  3. Also set sender identity:
     https://supabase.com/dashboard/project/${PROJECT_REF}/auth/templates
     → At top: "From email" and "From name" → set to e.g.:
        From name:  CLM Electronics
        From email: noreply@clm-electronics.com  (requires Custom SMTP)
     Without custom SMTP the envelope will still be noreply@mail.supabase.io
     but the display name and body will be fully CLM-branded.

  4. Configure Custom SMTP (recommended so sender is @yourdomain):
     https://supabase.com/dashboard/project/${PROJECT_REF}/auth/smtp
     Use your SMTP provider (Resend, SendGrid, AWS SES, Gmail). After saving,
     the From email above will be used.

  5. Set Site URL:
     https://supabase.com/dashboard/project/${PROJECT_REF}/auth/url-configuration
     Site URL = https://your-production-domain.com  (or http://localhost:3000 for dev)
     Additional Redirect URLs = http://localhost:3000/auth/callback, https://your-domain.com/auth/callback

Done — new invites/resets will be CLM-branded.

To automate next time:
  SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=${PROJECT_REF} node scripts/apply-email-templates.mjs
`);
  process.exit(0);
}

async function apply() {
  const base = `https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth`;
  console.log(`Fetching current auth config for ${PROJECT_REF}…`);
  const getRes = await fetch(base, { headers: { Authorization: `Bearer ${ACCESS_TOKEN}` } });
  if (!getRes.ok) {
    console.error(`GET ${base} failed: ${getRes.status} ${await getRes.text()}`);
    process.exit(1);
  }
  const current = await getRes.json();

  // Supabase Management API stores templates under mailer_templates or similar.
  // Shape varies; we patch the known mailer fields. Keep everything else as-is.
  const body = {
    // Keep site_url as-is unless you want to override:
    // site_url: current.site_url,
    mailer_subjects: {
      ...(current.mailer_subjects || {}),
      confirmation: templates.confirm.subject,
      recovery: templates.recovery.subject,
      invite: templates.invite.subject,
      magic_link: templates.magiclink.subject,
    },
    mailer_templates: {
      ...(current.mailer_templates || {}),
      confirmation: { content: templates.confirm.content },
      recovery: { content: templates.recovery.content },
      invite: { content: templates.invite.content },
      magic_link: { content: templates.magiclink.content },
    },
    // Optionally brand sender — uncomment and set your domain + SMTP first:
    // mailer_sender_name: "CLM Electronics",
    // mailer_sender_email: "noreply@clm-electronics.com",
  };

  console.log("Patching email templates…");
  const patchRes = await fetch(base, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await patchRes.text();
  if (!patchRes.ok) {
    console.error(`PATCH failed: ${patchRes.status} ${text}`);
    console.error("\nTip: If 404/400, paste templates manually via dashboard (see output above).");
    process.exit(1);
  }
  console.log("✓ Email templates updated to CLM branding.");
  console.log(text.slice(0, 800));
}

apply().catch((e) => { console.error(e); process.exit(1); });
