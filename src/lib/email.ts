// Transactional email through the Resend HTTP API.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const emailConfigured = () =>
  Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);

/**
 * Sends one email, and throws if it could not be handed to Resend. Without
 * RESEND_API_KEY and EMAIL_FROM: in development the message is printed to the
 * server console so the flow stays testable; in production it throws, so
 * check emailConfigured() first to give the user a friendly error.
 */
export async function sendEmail({ to, subject, text, html }: EmailMessage): Promise<void> {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured — set RESEND_API_KEY and EMAIL_FROM.");
    }
    console.log(
      `[email not configured — printed instead of sent]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject,
      text,
      ...(html ? { html } : {}),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Resend rejected the email (${res.status}): ${detail.slice(0, 300)}`);
  }
}
