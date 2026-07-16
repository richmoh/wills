import { NextRequest } from "next/server";
import { createSession, hashPassword, isValidEmail } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const fullName = (body?.fullName ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  if (fullName.length < 2) {
    return Response.json({ error: "Please enter your full name." }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await queryOne(`select id from users where email = $1`, [email]);
  if (existing) {
    return Response.json(
      { error: "An account with that email already exists — try signing in." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await queryOne<{ id: string }>(
    `insert into users (email, password_hash, full_name) values ($1, $2, $3) returning id`,
    [email, passwordHash, fullName]
  );
  await createSession(user!.id);
  return Response.json({ ok: true });
}
