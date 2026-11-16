// Transactional email through our own Postal server, which hands each message
// to Amazon SES for delivery. Postal's HTTP API is used because its SMTP port
// is not open to the internet. Wasiyyah has its own Postal server and key, so
// the key can send only from Wasiyyah's sending domain.

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

const DEFAULT_POSTAL_URL = "https://email.oneabsolute.co.uk";

/** Nothing receives mail at the sending domain (mail.wasiyyahwills.com), so
 *  every message carries a Reply-To that a person reads. */
const DEFAULT_REPLY_TO = "hello@wasiyyahwills.com";

export const emailConfigured = () =>
  Boolean(process.env.POSTAL_API_KEY && process.env.EMAIL_FROM);

/**
 * Sends one email, and throws if Postal did not accept it. Without
 * POSTAL_API_KEY and EMAIL_FROM: in development the message is printed to the
 * server console so the flow stays testable; in production it throws, so
 * check emailConfigured() first to give the user a friendly error.
 */
export async function sendEmail({ to, subject, text, html }: EmailMessage): Promise<void> {
  const key = process.env.POSTAL_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email is not configured — set POSTAL_API_KEY and EMAIL_FROM.");
    }
    console.log(
      `[email not configured — printed instead of sent]\nTo: ${to}\nSubject: ${subject}\n\n${text}\n`
    );
    return;
  }

  const base = (process.env.POSTAL_URL || DEFAULT_POSTAL_URL).replace(/\/+$/, "");
  const res = await fetch(`${base}/api/v1/send/message`, {
    method: "POST",
    headers: {
      "X-Server-API-Key": key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      plain_body: text,
      ...(html ? { html_body: html } : {}),
      reply_to: process.env.EMAIL_REPLY_TO || DEFAULT_REPLY_TO,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  // Postal answers HTTP 200 even when it refuses a message and puts the
  // verdict in `status`, so the HTTP status alone would hide real failures.
  const body = (await res.json().catch(() => null)) as
    | { status?: string; data?: unknown }
    | null;
  if (!res.ok || body?.status !== "success") {
    const detail = JSON.stringify(body?.data ?? body ?? {}).slice(0, 300);
    throw new Error(
      `Postal refused the email (HTTP ${res.status}, ${body?.status ?? "no status"}): ${detail}`
    );
  }
}
