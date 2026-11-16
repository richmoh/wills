import { NextRequest } from "next/server";
import {
  createSession,
  hashPassword,
  isValidEmail,
  passwordError,
  stringField,
} from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { clientIp, HOUR, rateLimited } from "@/lib/rate-limit";

const emailTaken = () =>
  Response.json(
    { error: "An account with that email already exists — try signing in." },
    { status: 409 }
  );

const isUniqueViolation = (e: unknown) =>
  typeof e === "object" && e !== null && (e as { code?: unknown }).code === "23505";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const fullName = (stringField(body, "fullName") ?? "").trim();
  const email = (stringField(body, "email") ?? "").trim().toLowerCase();
  const password = stringField(body, "password") ?? "";
  const consent = (body as { consent?: unknown } | null)?.consent === true;

  if (fullName.length < 2 || fullName.length > 200) {
    return Response.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  const badPassword = passwordError(password);
  if (badPassword) {
    return Response.json({ error: badPassword }, { status: 400 });
  }
  // The answers reveal religious belief, so UK GDPR needs explicit consent.
  if (!consent) {
    return Response.json(
      {
        error:
          "Please tick the box to consent to Wasiyyah storing your answers — we cannot prepare your will without it.",
      },
      { status: 400 }
    );
  }

  const blocked = rateLimited(`signup:${clientIp(req)}`, 10, HOUR);
  if (blocked) return blocked;

  const existing = await queryOne(`select id from users where email = $1`, [email]);
  if (existing) return emailTaken();

  const passwordHash = await hashPassword(password);
  let user: { id: string } | null;
  try {
    user = await queryOne<{ id: string }>(
      `insert into users (email, password_hash, full_name, consented_at)
       values ($1, $2, $3, now()) returning id`,
      [email, passwordHash, fullName]
    );
  } catch (e) {
    // two signups for the same email at once: the second one loses the race
    if (isUniqueViolation(e)) return emailTaken();
    throw e;
  }
  await createSession(user!.id);
  return Response.json({ ok: true });
}
