import { NextRequest } from "next/server";
import {
  destroySession,
  MAX_PASSWORD_LENGTH,
  requireUser,
  stringField,
  verifyPassword,
} from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { MINUTE, rateLimited } from "@/lib/rate-limit";

/** Permanently deletes the signed-in user's account and everything in it. */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json().catch(() => null);
    const password = stringField(body, "password") ?? "";
    if (!password) {
      return Response.json(
        { error: "Please enter your password to confirm." },
        { status: 400 }
      );
    }

    const blocked = rateLimited(`delete-account:${user.id}`, 10, 15 * MINUTE);
    if (blocked) return blocked;

    const row = await queryOne<{ password_hash: string }>(
      `select password_hash from users where id = $1`,
      [user.id]
    );
    if (
      !row ||
      password.length > MAX_PASSWORD_LENGTH ||
      !(await verifyPassword(password, row.password_hash))
    ) {
      return Response.json(
        { error: "That password is incorrect — your account has not been deleted." },
        { status: 403 }
      );
    }

    // sessions, wills, payments and reset tokens go with it (on delete cascade)
    await query(`delete from users where id = $1`, [user.id]);
    await destroySession();
    return Response.json({ ok: true });
  } catch (r) {
    if (r instanceof Response) return r;
    throw r;
  }
}
