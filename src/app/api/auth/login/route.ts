import { NextRequest } from "next/server";
import {
  createSession,
  MAX_PASSWORD_LENGTH,
  stringField,
  verifyPasswordOrDummy,
} from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { clientIp, MINUTE, rateLimited } from "@/lib/rate-limit";

const incorrect = () =>
  Response.json({ error: "Email or password is incorrect." }, { status: 401 });

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (stringField(body, "email") ?? "").trim().toLowerCase();
  const password = stringField(body, "password") ?? "";
  if (!email || !password) {
    return Response.json(
      { error: "Please enter your email and password." },
      { status: 400 }
    );
  }

  const ip = clientIp(req);
  const blocked =
    rateLimited(`login:${ip}`, 30, 15 * MINUTE) ??
    rateLimited(`login:${ip}:${email}`, 10, 15 * MINUTE);
  if (blocked) return blocked;

  // no account can have these, so don't spend a bcrypt comparison on them
  if (email.length > 254 || password.length > MAX_PASSWORD_LENGTH) return incorrect();

  const user = await queryOne<{ id: string; password_hash: string }>(
    `select id, password_hash from users where email = $1`,
    [email]
  );
  const matches = await verifyPasswordOrDummy(password, user?.password_hash);
  if (!user || !matches) return incorrect();

  await query(`delete from sessions where user_id = $1 and expires_at <= now()`, [user.id]);
  await createSession(user.id);
  return Response.json({ ok: true });
}
