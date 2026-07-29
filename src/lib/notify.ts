import { Resend } from 'resend';

const FROM = process.env.GS_EMAIL_FROM ?? 'GS Chairs <noreply@gschairs.test>';

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
