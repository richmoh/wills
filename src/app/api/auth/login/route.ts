import { NextRequest } from "next/server";
import { createSession, verifyPassword } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  const user = await queryOne<{ id: string; password_hash: string }>(
    `select id, password_hash from users where email = $1`,
    [email]
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return Response.json(
      { error: "Email or password is incorrect." },
      { status: 401 }
    );
  }
  await createSession(user.id);
  return Response.json({ ok: true });
}
