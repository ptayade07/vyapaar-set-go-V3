import { Resend } from "resend";

// Sandbox mode until a real domain is verified with Resend (see PRODUCTION_STAGES.md): with no
// verified domain, Resend only allows sending FROM this address and only delivers TO the email
// the Resend account itself was signed up with -- real password-reset emails to arbitrary
// shopkeepers won't actually land in their inbox until a domain is added. The whole flow this
// powers is built and correct regardless; only deliverability is limited right now. Once a domain
// is verified, change FROM_ADDRESS to something on it -- no other code changes needed.
const FROM_ADDRESS = "Vyapaar Set Go <onboarding@resend.dev>";

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
    html: `
      <p>Namaste,</p>
      <p>Someone (hopefully you) asked to reset the password for your Vyapaar Set Go shop login.</p>
      <p><a href="${resetUrl}">Click here to set a new password</a>. This link works for 1 hour.</p>
      <p>If you didn't ask for this, you can safely ignore this email -- your password won't change.</p>
    `,
  });

  if (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
  return true;
}
