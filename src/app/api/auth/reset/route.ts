import { NextRequest } from "next/server";
import {
  createSession,
  hashPassword,
  hashToken,
  passwordError,
  stringField,
} from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { clientIp, HOUR, rateLimited } from "@/lib/rate-limit";

const invalidLink = () =>
  Response.json(
    {
      error: "This reset link is invalid or has expired — please request a new one.",
      invalidLink: true,
    },
    { status: 400 }
  );

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const token = stringField(body, "token") ?? "";
  const password = stringField(body, "password") ?? "";

  if (!token || token.length > 200) return invalidLink();
  const badPassword = passwordError(password);
  if (badPassword) {
    return Response.json({ error: badPassword }, { status: 400 });
  }

  const blocked = rateLimited(`reset:${clientIp(req)}`, 10, HOUR);
  if (blocked) return blocked;

  // One statement, so it is all or nothing: the token is spent only if the
  // password changes, a link cannot be used twice, and every existing session
  // for the account is signed out.
  const passwordHash = await hashPassword(password);
  const user = await queryOne<{ id: string }>(
    `with spent as (
       update password_resets set used_at = now()
        where token_hash = $1 and used_at is null and expires_at > now()
        returning user_id
     ), changed as (
       update users set password_hash = $2
        where id in (select user_id from spent)
        returning id
     ), signed_out as (
       delete from sessions where user_id in (select id from changed)
     )
     select id from changed`,
    [hashToken(token), passwordHash]
  );
  if (!user) return invalidLink();

  await createSession(user.id);
  return Response.json({ ok: true });
}
