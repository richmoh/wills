import { after, NextRequest } from "next/server";
import { hashToken, isValidEmail, newToken, stringField } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { emailConfigured, sendEmail } from "@/lib/email";
import { clientIp, HOUR, rateLimited } from "@/lib/rate-limit";
import { appUrl } from "@/lib/stripe";

const resetEmail = (url: string) =>
  `As-salamu alaykum,

We received a request to reset the password for your Wasiyyah account. Choose a new password here:

${url}

The link works once and expires in one hour. If you did not ask for this, you can ignore this email — your password has not been changed.

Wasiyyah
support@themuslimguide.org
`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (stringField(body, "email") ?? "").trim().toLowerCase();
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const blocked =
    rateLimited(`forgot:ip:${clientIp(req)}`, 5, HOUR) ??
    rateLimited(`forgot:email:${email}`, 5, HOUR);
  if (blocked) return blocked;

  const production = process.env.NODE_ENV === "production";
  if (production && !emailConfigured()) {
    return Response.json(
      {
        error:
          "We cannot send password reset emails at the moment — please email support@themuslimguide.org and we will help you back into your account.",
      },
      { status: 503 }
    );
  }

  // From here the response is the same whether or not the account exists.
  const user = await queryOne<{ id: string }>(`select id from users where email = $1`, [email]);
  if (!user) return Response.json({ ok: true });

  const token = newToken();
  await query(
    `delete from password_resets where user_id = $1 and (used_at is null or expires_at <= now())`,
    [user.id]
  );
  await query(
    `insert into password_resets (token_hash, user_id, expires_at)
     values ($1, $2, now() + interval '1 hour')`,
    [hashToken(token), user.id]
  );

  // Production links always use the configured URL, never the request's Host.
  const base = production ? appUrl() : req.nextUrl.origin;
  const url = `${base}/reset-password?token=${token}`;

  // Sent after the response, so how long it takes does not reveal the account.
  after(() =>
    sendEmail({
      to: email,
      subject: "Reset your Wasiyyah password",
      text: resetEmail(url),
    }).catch((e) => console.error("Password reset email failed:", e))
  );

  // Development without an email provider: hand the link back so it can be followed.
  if (!production && !emailConfigured()) {
    return Response.json({ ok: true, devResetUrl: url });
  }
  return Response.json({ ok: true });
}
