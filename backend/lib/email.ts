import { Resend } from "resend";

// Sandbox mode until a real domain is verified with Resend (see PRODUCTION_STAGES.md): with no
// verified domain, Resend only allows sending FROM this address and only delivers TO the email
// the Resend account itself was signed up with -- real password-reset emails to arbitrary
// shopkeepers won't actually land in their inbox until a domain is added. The whole flow this
// powers is built and correct regardless; only deliverability is limited right now. Once a domain
// is verified, change FROM_ADDRESS to something on it -- no other code changes needed.
const FROM_ADDRESS = "Vyapaar Set Go <onboarding@resend.dev>";

// Same palette as app/globals.css (orange-600 #EA580C, background #FAF8F5, gray-900/500/200) --
// hardcoded rather than referencing the CSS, since email clients don't support CSS custom
// properties and most strip <style> blocks entirely, so everything here is inline by necessity.
function buildPasswordResetEmailHtml(resetUrl: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0; padding:0; background-color:#FAF8F5; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F5; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
            <tr>
              <td style="padding: 40px 32px 24px 32px; text-align:center;">
                <div style="display:inline-block; width:56px; height:56px; line-height:56px; background-color:#EA580C; border-radius:16px; color:#ffffff; font-size:28px; font-weight:bold; text-align:center;">व</div>
                <h1 style="margin: 20px 0 4px 0; font-size:20px; color:#111827; font-weight:700;">Vyapaar Set Go</h1>
                <p style="margin:0; font-size:13px; color:#6B7280;">Password Reset Request</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 8px 32px;">
                <p style="margin:0 0 16px 0; font-size:15px; line-height:1.6; color:#111827;">Namaste,</p>
                <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#111827;">
                  Someone (hopefully you) asked to reset the password for your Vyapaar Set Go shop login.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 24px 32px; text-align:center;">
                <a href="${resetUrl}" style="display:inline-block; background-color:#EA580C; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; padding:14px 32px; border-radius:12px;">
                  Set a new password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 0 32px 32px 32px;">
                <p style="margin:0 0 8px 0; font-size:13px; line-height:1.6; color:#6B7280;">
                  This link works for 1 hour and can only be used once.
                </p>
                <p style="margin:0; font-size:13px; line-height:1.6; color:#6B7280;">
                  If you didn't ask for this, you can safely ignore this email — your password won't change.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px 32px; background-color:#FAF8F5; border-top:1px solid #E5E7EB;">
                <p style="margin:0; font-size:11px; line-height:1.5; color:#9CA3AF; word-break:break-all;">
                  Button not working? Copy this link: ${resetUrl}
                </p>
              </td>
            </tr>
          </table>
          <p style="margin: 16px 0 0 0; font-size:11px; color:#9CA3AF;">Vyapaar Set Go — Digital khata for your shop</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildPasswordResetEmailText(resetUrl: string): string {
  return [
    "Namaste,",
    "",
    "Someone (hopefully you) asked to reset the password for your Vyapaar Set Go shop login.",
    "",
    `Set a new password: ${resetUrl}`,
    "",
    "This link works for 1 hour and can only be used once.",
    "",
    "If you didn't ask for this, you can safely ignore this email -- your password won't change.",
    "",
    "-- Vyapaar Set Go",
  ].join("\n");
}

export async function sendPasswordResetEmail(toEmail: string, resetUrl: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set -- cannot send password reset email.");
    return false;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: toEmail,
    subject: "Reset your Vyapaar Set Go password",
    html: buildPasswordResetEmailHtml(resetUrl),
    text: buildPasswordResetEmailText(resetUrl),
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
  return true;
}
