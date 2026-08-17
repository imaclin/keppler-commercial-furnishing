import { Resend } from 'resend';

// KEPPLER_EMAIL_FROM is the name going forward; GS_EMAIL_FROM stays as a
// fallback because that is the variable already set in Vercel, and email must
// not silently break between the rename deploy and the env var being updated.
const FROM = process.env.KEPPLER_EMAIL_FROM
  ?? process.env.GS_EMAIL_FROM
  ?? 'Keppler Commercial Furnishing <noreply@keppler.test>';

export function emailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

// Best-effort transactional email. No-op (logs) when RESEND_API_KEY is unset.
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!emailEnabled()) {
    console.log(`[email disabled] to=${to} subject="${subject}"`);
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from: FROM, to, subject, text });
  } catch (e) {
    console.error('sendEmail failed', e);
  }
}
